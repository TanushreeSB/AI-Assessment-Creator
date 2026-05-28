import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { IAssignment } from '../config/db';

class PDFService {
  private pdfsDir = path.join(__dirname, '../../public/pdfs');

  constructor() {
    this.ensureDirsExist();
  }

  private ensureDirsExist() {
    const publicDir = path.join(__dirname, '../../public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
    }
    if (!fs.existsSync(this.pdfsDir)) {
      fs.mkdirSync(this.pdfsDir);
    }
  }

  async generateAssignmentPDF(assignment: IAssignment): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `assignment-${assignment._id}.pdf`;
        const filePath = path.join(this.pdfsDir, fileName);
        const writeStream = fs.createWriteStream(filePath);

        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true
        });

        doc.pipe(writeStream);

        // --- Document Header ---
        doc
          .font('Helvetica-Bold')
          .fontSize(18)
          .text('Delhi Public School, Bokaro Steel City', { align: 'center' });
        
        doc
          .fontSize(14)
          .text(`Subject Assessment: ${assignment.title}`, { align: 'center' })
          .moveDown(0.2);

        doc
          .font('Helvetica')
          .fontSize(10)
          .text('Class: 5th Grade | Term Examination', { align: 'center' })
          .moveDown(0.5);

        // --- Metadata Table Line ---
        const totalQuestions = assignment.sections?.reduce((sum, s) => sum + s.questions.length, 0) || 0;
        const totalMarks = assignment.sections?.reduce((sum, s) => sum + s.questions.reduce((ms, q) => ms + q.marks, 0), 0) || 0;

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Time Allowed: 60 minutes', 50, 110);
        doc.text(`Maximum Marks: ${totalMarks} Marks`, doc.page.width - 200, 110, { align: 'right' });
        
        // Horizontal Line
        doc
          .moveTo(50, 125)
          .lineTo(doc.page.width - 50, 125)
          .stroke();

        doc.moveDown(1.5);

        // --- Student Information Section ---
        const startY = 135;
        doc.font('Helvetica').fontSize(10);
        doc.text('Student Name:', 50, startY);
        doc.text('_____________________________________', 130, startY);

        doc.text('Roll Number:', 50, startY + 20);
        doc.text('__________________', 130, startY + 20);

        doc.text('Class & Section:', doc.page.width - 220, startY + 20);
        doc.text('__________________', doc.page.width - 140, startY + 20);

        // Horizontal Line below student info
        doc
          .moveTo(50, startY + 40)
          .lineTo(doc.page.width - 50, startY + 40)
          .stroke();

        doc.moveDown(2);

        // --- Instructions ---
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .text('General Instructions:')
          .font('Helvetica')
          .fontSize(9)
          .text('1. All questions are compulsory.')
          .text('2. Keep your handwriting clean and legible.')
          .text('3. Use of calculators or electronic devices is strictly prohibited.')
          .text(`4. ${assignment.additionalInstructions || 'Answer the questions in the space provided.'}`)
          .moveDown(1.5);

        // --- Questions Sections ---
        let currentQuestionNum = 1;

        if (assignment.sections && assignment.sections.length > 0) {
          assignment.sections.forEach((section, sIndex) => {
            // Draw Section Title
            doc
              .font('Helvetica-Bold')
              .fontSize(12)
              .text(section.title, { underline: true })
              .moveDown(0.2);

            // Draw Section Instructions
            doc
              .font('Helvetica-Oblique')
              .fontSize(9)
              .text(section.instruction)
              .moveDown(0.8);

            // Draw Questions
            section.questions.forEach((q) => {
              doc.font('Helvetica').fontSize(10.5);

              // Prefix difficulty badge textually
              const diffText = `[${q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}]`;
              
              // We want to align the question number and text
              const qNumText = `${currentQuestionNum}. `;
              const qFullText = q.questionText;
              const marksText = `[${q.marks} Mark(s)]`;

              const xPos = 50;
              const textWidth = doc.page.width - 170; // Leave space for marks on the right

              // Draw Question text block
              doc.font('Helvetica-Bold').text(qNumText, xPos, doc.y, { continued: true });
              doc.font('Helvetica').text(qFullText, { width: textWidth, continued: true });
              
              // Draw difficulty tag
              doc.font('Helvetica-Oblique').fillColor('#6b7280').text(`  ${diffText} `, { continued: false });
              doc.fillColor('black'); // Reset color

              // Draw Marks right-aligned on same y position
              const lastY = doc.y - 12; // approximate y align
              doc.font('Helvetica-Bold').text(marksText, doc.page.width - 120, lastY, { width: 70, align: 'right' });

              doc.moveDown(1.2);
              currentQuestionNum++;
            });

            doc.moveDown(1);
          });
        } else {
          doc.text('No questions generated for this assignment.', { align: 'center' });
        }

        // --- Answer Key Page ---
        if (assignment.answerKey && assignment.answerKey.length > 0) {
          doc.addPage();
          
          doc
            .font('Helvetica-Bold')
            .fontSize(16)
            .text('Answer Key & Marking Scheme', { align: 'center' })
            .moveDown(1);

          assignment.answerKey.forEach((ans) => {
            doc.font('Helvetica-Bold').fontSize(10.5).text(`Question ${ans.questionNumber}:`);
            doc.font('Helvetica').fontSize(10).text(ans.answerText).moveDown(1);
          });
        }

        // --- Add Page Numbers to all pages ---
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).fillColor('#6b7280');
          doc.text(
            `Page ${i + 1} of ${range.count} | VedaAI Assessment Platform`,
            50,
            doc.page.height - 30,
            { align: 'center' }
          );
        }

        doc.end();

        writeStream.on('finish', () => {
          console.log(`PDF successfully generated: ${filePath}`);
          resolve(`/pdfs/${fileName}`);
        });

        writeStream.on('error', (err) => {
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}

export const pdfService = new PDFService();
