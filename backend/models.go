package main

// Stream represents a class stream (e.g., "Form 3 B")
type Stream struct {
	ID        string `json:"id"`
	SchoolID  string `json:"schoolId"`
	ClassName string `json:"className"`
	StreamName string `json:"streamName"`
}

// Subject represents a subject taught in a class with its coefficient
type Subject struct {
	ID        string  `json:"id"`
	SchoolID  string  `json:"schoolId"`
	ClassID   string  `json:"classId"`
	Name      string  `json:"name"`
	Coefficient float64 `json:"coefficient"`
}
