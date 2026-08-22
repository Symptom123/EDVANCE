package main

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path"
	"strings"
	"time"
)

type S3Client struct {
	Endpoint  string
	AccessKey string
	SecretKey string
	Region    string
	Bucket    string
	HTTP      *http.Client
}

var globalS3 *S3Client

func initS3Client() {
	endpoint := os.Getenv("AWS_ENDPOINT_URL_S3")
	accessKey := os.Getenv("AWS_ACCESS_KEY_ID")
	secretKey := os.Getenv("AWS_SECRET_ACCESS_KEY")
	region := os.Getenv("AWS_REGION")
	bucket := os.Getenv("AWS_S3_BUCKET")

	if region == "" {
		region = "us-east-2"
	}
	if bucket == "" {
		bucket = "edvance-files"
	}

	if endpoint != "" && accessKey != "" && secretKey != "" {
		globalS3 = &S3Client{
			Endpoint:  strings.TrimRight(endpoint, "/"),
			AccessKey: accessKey,
			SecretKey: secretKey,
			Region:    region,
			Bucket:    bucket,
			HTTP:      &http.Client{Timeout: 60 * time.Second},
		}
		log.Printf("[S3] ✅ Object Storage configured for endpoint: %s (region: %s, bucket: %s)", endpoint, region, bucket)
	} else {
		log.Println("[S3] ⚠️ S3 credentials not fully specified in environment. Object storage falling back to local files.")
	}
}

func (s *S3Client) IsConfigured() bool {
	return s != nil && s.Endpoint != "" && s.AccessKey != "" && s.SecretKey != ""
}

// hmacSHA256 helper
func hmacSHA256(key []byte, data string) []byte {
	h := hmac.New(sha256.New, key)
	h.Write([]byte(data))
	return h.Sum(nil)
}

func sha256Hex(data []byte) string {
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:])
}

// getSignatureKey derives signing key for AWS SigV4
func getSignatureKey(secret, dateStamp, regionName, serviceName string) []byte {
	kDate := hmacSHA256([]byte("AWS4"+secret), dateStamp)
	kRegion := hmacSHA256(kDate, regionName)
	kService := hmacSHA256(kRegion, serviceName)
	kSigning := hmacSHA256(kService, "aws4_request")
	return kSigning
}

// UploadToS3 uploads data buffer to the S3 bucket with SigV4 authentication
func (s *S3Client) UploadToS3(objectKey string, data []byte, contentType string) (string, error) {
	if !s.IsConfigured() {
		return "", fmt.Errorf("S3 client not configured")
	}

	if contentType == "" {
		contentType = "application/octet-stream"
	}

	// Clean object key
	cleanKey := strings.TrimPrefix(objectKey, "/")
	reqURL := fmt.Sprintf("%s/%s/%s", s.Endpoint, s.Bucket, cleanKey)
	parsedURL, err := url.Parse(reqURL)
	if err != nil {
		return "", fmt.Errorf("invalid S3 URL: %w", err)
	}

	now := time.Now().UTC()
	amzDate := now.Format("20060102T150405Z")
	dateStamp := now.Format("20060102")

	payloadHash := sha256Hex(data)

	req, err := http.NewRequest(http.MethodPut, reqURL, bytes.NewReader(data))
	if err != nil {
		return "", err
	}

	req.Header.Set("Host", parsedURL.Host)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("x-amz-date", amzDate)
	req.Header.Set("x-amz-content-sha256", payloadHash)

	// Build SigV4
	canonicalURI := parsedURL.EscapedPath()
	if canonicalURI == "" {
		canonicalURI = "/"
	}
	canonicalQuery := ""
	canonicalHeaders := fmt.Sprintf("content-type:%s\nhost:%s\nx-amz-content-sha256:%s\nx-amz-date:%s\n",
		contentType, parsedURL.Host, payloadHash, amzDate)
	signedHeaders := "content-type;host;x-amz-content-sha256;x-amz-date"

	canonicalRequest := fmt.Sprintf("%s\n%s\n%s\n%s\n%s\n%s",
		http.MethodPut, canonicalURI, canonicalQuery, canonicalHeaders, signedHeaders, payloadHash)

	algorithm := "AWS4-HMAC-SHA256"
	credentialScope := fmt.Sprintf("%s/%s/s3/aws4_request", dateStamp, s.Region)
	stringToSign := fmt.Sprintf("%s\n%s\n%s\n%s",
		algorithm, amzDate, credentialScope, sha256Hex([]byte(canonicalRequest)))

	signingKey := getSignatureKey(s.SecretKey, dateStamp, s.Region, "s3")
	signature := hex.EncodeToString(hmacSHA256(signingKey, stringToSign))

	authHeader := fmt.Sprintf("%s Credential=%s/%s, SignedHeaders=%s, Signature=%s",
		algorithm, s.AccessKey, credentialScope, signedHeaders, signature)

	req.Header.Set("Authorization", authHeader)

	resp, err := s.HTTP.Do(req)
	if err != nil {
		return "", fmt.Errorf("S3 upload request error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("S3 returned status %d: %s", resp.StatusCode, string(body))
	}

	return reqURL, nil
}

// DownloadFromS3 downloads an object from S3 using SigV4 authentication
func (s *S3Client) DownloadFromS3(objectKey string) ([]byte, string, error) {
	if !s.IsConfigured() {
		return nil, "", fmt.Errorf("S3 client not configured")
	}

	cleanKey := strings.TrimPrefix(objectKey, "/")
	reqURL := fmt.Sprintf("%s/%s/%s", s.Endpoint, s.Bucket, cleanKey)
	parsedURL, err := url.Parse(reqURL)
	if err != nil {
		return nil, "", fmt.Errorf("invalid S3 URL: %w", err)
	}

	now := time.Now().UTC()
	amzDate := now.Format("20060102T150405Z")
	dateStamp := now.Format("20060102")
	payloadHash := sha256Hex([]byte(""))

	req, err := http.NewRequest(http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, "", err
	}

	req.Header.Set("Host", parsedURL.Host)
	req.Header.Set("x-amz-date", amzDate)
	req.Header.Set("x-amz-content-sha256", payloadHash)

	canonicalURI := parsedURL.EscapedPath()
	if canonicalURI == "" {
		canonicalURI = "/"
	}
	canonicalHeaders := fmt.Sprintf("host:%s\nx-amz-content-sha256:%s\nx-amz-date:%s\n",
		parsedURL.Host, payloadHash, amzDate)
	signedHeaders := "host;x-amz-content-sha256;x-amz-date"

	canonicalRequest := fmt.Sprintf("%s\n%s\n\n%s\n%s\n%s",
		http.MethodGet, canonicalURI, canonicalHeaders, signedHeaders, payloadHash)

	algorithm := "AWS4-HMAC-SHA256"
	credentialScope := fmt.Sprintf("%s/%s/s3/aws4_request", dateStamp, s.Region)
	stringToSign := fmt.Sprintf("%s\n%s\n%s\n%s",
		algorithm, amzDate, credentialScope, sha256Hex([]byte(canonicalRequest)))

	signingKey := getSignatureKey(s.SecretKey, dateStamp, s.Region, "s3")
	signature := hex.EncodeToString(hmacSHA256(signingKey, stringToSign))

	authHeader := fmt.Sprintf("%s Credential=%s/%s, SignedHeaders=%s, Signature=%s",
		algorithm, s.AccessKey, credentialScope, signedHeaders, signature)

	req.Header.Set("Authorization", authHeader)

	resp, err := s.HTTP.Do(req)
	if err != nil {
		return nil, "", fmt.Errorf("S3 download request error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return nil, "", fmt.Errorf("S3 returned status %d: %s", resp.StatusCode, string(body))
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", err
	}

	contentType := resp.Header.Get("Content-Type")
	return data, contentType, nil
}

// GenerateS3Key generates a clean S3 key for school file storage
func GenerateS3Key(schoolId, category, fileId, originalFilename string) string {
	cleanName := path.Base(originalFilename)
	if schoolId == "" {
		schoolId = "global"
	}
	if category == "" {
		category = "documents"
	}
	return fmt.Sprintf("schools/%s/%s/%s_%s", schoolId, category, fileId, cleanName)
}
