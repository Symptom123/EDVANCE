import { forwardRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Award, Star, Calendar } from "lucide-react";
import { SubjectMark } from "./ReportCardForm";

interface ReportCardProps {
  studentName: string;
  studentClass: string;
  marks: SubjectMark[];
}

const calculateGrade = (percentage: number): { grade: string, color: string, remarks: string } => {
  if (percentage >= 90) return { grade: "A+", color: "excellence-glow gold-gradient", remarks: "Outstanding Performance" };
  if (percentage >= 80) return { grade: "A", color: "gold-gradient", remarks: "Excellent" };
  if (percentage >= 70) return { grade: "B+", color: "academic-gradient", remarks: "Very Good" };
  if (percentage >= 60) return { grade: "B", color: "academic-gradient", remarks: "Good" };
  if (percentage >= 50) return { grade: "C+", color: "bg-secondary", remarks: "Satisfactory" };
  if (percentage >= 40) return { grade: "C", color: "bg-muted", remarks: "Needs Improvement" };
  if (percentage >= 30) return { grade: "D", color: "bg-muted", remarks: "Below Average" };
  return { grade: "F", color: "bg-destructive", remarks: "Unsatisfactory" };
};

export const ReportCard = forwardRef<HTMLDivElement, ReportCardProps>(
  ({ studentName, studentClass, marks }, ref) => {
    const totalMarks = marks.reduce((sum, subject) => sum + subject.mark, 0);
    const totalSubjects = marks.length;
    const maxPossibleMarks = totalSubjects * 100;
    const percentage = totalSubjects > 0 ? (totalMarks / maxPossibleMarks) * 100 : 0;
    const gradeInfo = calculateGrade(percentage);

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
      <div ref={ref} className="w-full max-w-4xl mx-auto bg-white">
        <Card className="report-card-shadow academic-border">
          {/* Template Header */}
          <CardHeader className="bg-white border-b-4 border-primary text-center py-6">
            <div className="border-2 border-primary rounded-lg p-6 mx-4">
              <CardTitle className="text-3xl font-bold text-primary mb-2">ACADEMIC REPORT CARD</CardTitle>
              <div className="h-1 bg-primary mx-auto w-32 mb-4"></div>
              <p className="text-lg text-foreground font-semibold">STUDENT PERFORMANCE REPORT</p>
              <div className="grid grid-cols-2 gap-4 mt-6 text-left">
                <div className="space-y-2">
                  <div className="flex">
                    <span className="font-semibold w-20">Student:</span>
                    <span className="border-b border-gray-400 flex-1 px-2">{studentName || "_______________"}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-20">Class:</span>
                    <span className="border-b border-gray-400 flex-1 px-2">{studentClass || "_______________"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex">
                    <span className="font-semibold w-20">Date:</span>
                    <span className="border-b border-gray-400 flex-1 px-2">{currentDate}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-20">Session:</span>
                    <span className="border-b border-gray-400 flex-1 px-2">{new Date().getFullYear()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Subject Marks Table */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-center mb-4 bg-primary text-white py-2 rounded">
                SUBJECT-WISE MARKS
              </h3>
              
              <div className="border-2 border-primary rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="py-3 px-4 text-left font-semibold">S.No.</th>
                      <th className="py-3 px-4 text-left font-semibold">Subject Name</th>
                      <th className="py-3 px-4 text-center font-semibold">Subject Code</th>
                      <th className="py-3 px-4 text-center font-semibold">Marks Obtained</th>
                      <th className="py-3 px-4 text-center font-semibold">Max Marks</th>
                      <th className="py-3 px-4 text-center font-semibold">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marks.map((subject, index) => {
                      const subjectGrade = calculateGrade(subject.mark);
                      return (
                        <tr key={subject.code} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                          <td className="py-3 px-4 border-b border-gray-200 text-center font-medium">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4 border-b border-gray-200 font-medium">
                            {subject.name}
                          </td>
                          <td className="py-3 px-4 border-b border-gray-200 text-center text-sm text-muted-foreground">
                            {subject.code}
                          </td>
                          <td className="py-3 px-4 border-b border-gray-200 text-center font-bold text-lg">
                            {subject.mark}
                          </td>
                          <td className="py-3 px-4 border-b border-gray-200 text-center">
                            100
                          </td>
                          <td className="py-3 px-4 border-b border-gray-200 text-center">
                            <Badge className={`${subjectGrade.color} text-white font-semibold`}>
                              {subjectGrade.grade}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Overall Performance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Performance Statistics */}
              <div className="border-2 border-primary rounded-lg p-4">
                <h4 className="font-bold text-center bg-primary text-white py-2 rounded mb-4">
                  PERFORMANCE SUMMARY
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="font-semibold">Total Marks Obtained:</span>
                    <span className="font-bold text-lg">{totalMarks}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="font-semibold">Maximum Marks:</span>
                    <span className="font-bold text-lg">{maxPossibleMarks}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="font-semibold">Percentage:</span>
                    <span className="font-bold text-lg text-primary">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-semibold">Overall Grade:</span>
                    <Badge className={`${gradeInfo.color} text-white font-bold text-lg`}>
                      {gradeInfo.grade}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Grade Scale */}
              <div className="border-2 border-primary rounded-lg p-4">
                <h4 className="font-bold text-center bg-primary text-white py-2 rounded mb-4">
                  GRADING SCALE
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>90% - 100%</span><span className="font-bold">A+</span></div>
                  <div className="flex justify-between"><span>80% - 89%</span><span className="font-bold">A</span></div>
                  <div className="flex justify-between"><span>70% - 79%</span><span className="font-bold">B+</span></div>
                  <div className="flex justify-between"><span>60% - 69%</span><span className="font-bold">B</span></div>
                  <div className="flex justify-between"><span>50% - 59%</span><span className="font-bold">C+</span></div>
                  <div className="flex justify-between"><span>40% - 49%</span><span className="font-bold">C</span></div>
                  <div className="flex justify-between"><span>30% - 39%</span><span className="font-bold">D</span></div>
                  <div className="flex justify-between"><span>Below 30%</span><span className="font-bold">F</span></div>
                </div>
              </div>
            </div>

            {/* Remarks Section */}
            <div className="border-2 border-primary rounded-lg p-4 mb-6">
              <h4 className="font-bold text-center bg-primary text-white py-2 rounded mb-4">
                TEACHER'S REMARKS
              </h4>
              <div className="text-center">
                <p className="text-lg font-semibold text-primary mb-2">{gradeInfo.remarks}</p>
                <div className="border-t-2 border-b-2 border-gray-300 py-4 my-4">
                  <p className="text-sm text-muted-foreground">
                    Student performance evaluation based on academic standards and assessment criteria.
                  </p>
                </div>
              </div>
            </div>

            {/* Signature Section */}
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="border-t-2 border-gray-400 pt-2">
                  <p className="font-semibold">Class Teacher</p>
                  <p className="text-sm text-muted-foreground">Signature & Date</p>
                </div>
              </div>
              <div>
                <div className="border-t-2 border-gray-400 pt-2">
                  <p className="font-semibold">Principal</p>
                  <p className="text-sm text-muted-foreground">Signature & Date</p>
                </div>
              </div>
              <div>
                <div className="border-t-2 border-gray-400 pt-2">
                  <p className="font-semibold">Parent/Guardian</p>
                  <p className="text-sm text-muted-foreground">Signature & Date</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t text-center text-xs text-muted-foreground">
              <p>This is a computer-generated report card. No signature is required for authenticity.</p>
              <p className="mt-1">Academic Report Card Generator © {new Date().getFullYear()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

ReportCard.displayName = "ReportCard";