import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Calculator } from "lucide-react";

export interface SubjectMark {
  code: string;
  name: string;
  mark: number;
}

interface ReportCardFormProps {
  onSubmit: (studentName: string, studentClass: string, marks: SubjectMark[]) => void;
}

const subjects = [
  { code: "ACC", name: "Accounting" },
  { code: "BIO", name: "Biology" },
  { code: "CHE", name: "Chemistry" },
  { code: "ECO", name: "Economics" },
  { code: "ENL", name: "English Language" },
  { code: "LIT", name: "Literature" },
  { code: "FUN", name: "Fundamentals" },
  { code: "FREN", name: "French" },
  { code: "GEO", name: "Geography" },
  { code: "HIS", name: "History" },
  { code: "CTZ", name: "Citizenship" },
  { code: "HBI", name: "Human Biology" },
  { code: "MAT", name: "Mathematics" },
  { code: "AMA", name: "Advanced Mathematics" },
  { code: "PHY", name: "Physics" },
  { code: "REL", name: "Religion" },
  { code: "LOG", name: "Logic" },
  { code: "CSC", name: "Computer Science" },
];

export const ReportCardForm = ({ onSubmit }: ReportCardFormProps) => {
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [marks, setMarks] = useState<{ [key: string]: string }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleMarkChange = (code: string, value: string) => {
    setMarks(prev => ({ ...prev, [code]: value }));
    
    // Clear error when user starts typing valid input
    if (errors[code] && (value === "" || (!isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= 100))) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[code];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    Object.entries(marks).forEach(([code, value]) => {
      if (value !== "") {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 0 || numValue > 100) {
          newErrors[code] = "Mark must be between 0 and 100";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const subjectMarks: SubjectMark[] = subjects.map(subject => ({
      code: subject.code,
      name: subject.name,
      mark: marks[subject.code] ? Number(marks[subject.code]) : 0
    })).filter(subject => marks[subject.code] !== "" && marks[subject.code] !== undefined);

    if (subjectMarks.length === 0) {
      alert("Please enter at least one subject mark.");
      return;
    }

    onSubmit(studentName, studentClass, subjectMarks);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto academic-border">
      <CardHeader className="academic-gradient text-white text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <GraduationCap className="h-8 w-8" />
          <CardTitle className="text-2xl font-bold">Academic Report Card Generator</CardTitle>
        </div>
        <p className="text-white/90">Enter your marks to generate a professional report card</p>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="studentName" className="text-lg font-semibold">
                Student Name (Optional)
              </Label>
              <Input
                id="studentName"
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter student name"
                className="text-lg p-3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentClass" className="text-lg font-semibold">
                Class (Optional)
              </Label>
              <Input
                id="studentClass"
                type="text"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                placeholder="Enter class (e.g., Grade 10-A)"
                className="text-lg p-3"
              />
            </div>
          </div>

          {/* Subject Marks Grid */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <Label className="text-lg font-semibold">Subject Marks</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <div key={subject.code} className="space-y-2">
                  <Label htmlFor={subject.code} className="font-medium">
                    {subject.name} ({subject.code})
                  </Label>
                  <Input
                    id={subject.code}
                    type="number"
                    min="0"
                    max="100"
                    value={marks[subject.code] || ""}
                    onChange={(e) => handleMarkChange(subject.code, e.target.value)}
                    placeholder="0-100"
                    className={`${errors[subject.code] ? "border-destructive" : ""}`}
                  />
                  {errors[subject.code] && (
                    <p className="text-sm text-destructive">{errors[subject.code]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full academic-gradient text-white font-semibold text-lg py-3 hover:opacity-90 transition-opacity"
          >
            <GraduationCap className="h-5 w-5 mr-2" />
            Generate Report Card
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};