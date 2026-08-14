import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ReportCardForm, SubjectMark } from "@/components/ReportCardForm";
import { ReportCard } from "@/components/ReportCard";
import { usePdfDownload } from "@/hooks/usePdfDownload";
import { Download, RefreshCw, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [reportData, setReportData] = useState<{
    studentName: string;
    studentClass: string;
    marks: SubjectMark[];
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const reportCardRef = useRef<HTMLDivElement>(null);
  const { downloadPdf } = usePdfDownload();
  const { toast } = useToast();

  const handleFormSubmit = (studentName: string, studentClass: string, marks: SubjectMark[]) => {
    setIsGenerating(true);
    
    // Simulate processing time for better UX
    setTimeout(() => {
      setReportData({ studentName, studentClass, marks });
      setIsGenerating(false);
      toast({
        title: "Report Card Generated!",
        description: "Your academic report card has been successfully created.",
      });
      
      // Scroll to report card
      setTimeout(() => {
        reportCardRef.current?.scrollIntoView({ 
          behavior: "smooth", 
          block: "start" 
        });
      }, 100);
    }, 1000);
  };

  const handleDownloadPdf = async () => {
    if (reportCardRef.current && reportData) {
      const filename = reportData.studentName 
        ? `${reportData.studentName.replace(/\s+/g, "_")}_report_card`
        : "academic_report_card";
      
      const success = await downloadPdf(reportCardRef.current, filename);
      
      if (success) {
        toast({
          title: "Download Complete!",
          description: "Your report card has been saved as a PDF.",
        });
      } else {
        toast({
          title: "Download Failed",
          description: "There was an error generating your PDF. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleReset = () => {
    setReportData(null);
    toast({
      title: "Reset Complete",
      description: "You can now generate a new report card.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-4 academic-gradient rounded-full">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
            Academic Report Card Generator
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create professional report cards with automatic grade calculations, 
            performance analysis, and PDF download functionality.
          </p>
        </div>

        {/* Form Section */}
        {!reportData && (
          <div className="mb-12">
            <ReportCardForm onSubmit={handleFormSubmit} />
            
            {isGenerating && (
              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-3 px-6 py-3 academic-gradient text-white rounded-full">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Generating your report card...
                </div>
              </div>
            )}
          </div>
        )}

        {/* Report Card Section */}
        {reportData && (
          <div className="space-y-8">
            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={handleDownloadPdf}
                className="academic-gradient text-white hover:opacity-90 transition-opacity"
                size="lg"
              >
                <Download className="h-5 w-5 mr-2" />
                Download PDF
              </Button>
              <Button 
                onClick={handleReset}
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-white"
                size="lg"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Generate New Report
              </Button>
            </div>

            {/* Report Card Display */}
            <div className="flex justify-center">
              <ReportCard 
                ref={reportCardRef}
                studentName={reportData.studentName}
                studentClass={reportData.studentClass}
                marks={reportData.marks}
              />
            </div>

            {/* Additional Info */}
            <div className="text-center text-muted-foreground mt-8">
              <p className="text-sm">
                💡 <strong>Tip:</strong> You can print this report card directly from your browser 
                or download it as a PDF using the button above.
              </p>
            </div>
          </div>
        )}

        {/* Features Section */}
        {!reportData && (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6 rounded-lg border border-primary/20 bg-card">
              <div className="w-12 h-12 academic-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Professional Design</h3>
              <p className="text-sm text-muted-foreground">
                Beautiful, academic-styled report cards with proper formatting and colors.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg border border-primary/20 bg-card">
              <div className="w-12 h-12 gold-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">PDF Download</h3>
              <p className="text-sm text-muted-foreground">
                Download your report cards as high-quality PDF files for printing or sharing.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg border border-primary/20 bg-card">
              <div className="w-12 h-12 academic-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Automatic Grading</h3>
              <p className="text-sm text-muted-foreground">
                Smart grade calculation with performance remarks and detailed analysis.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;