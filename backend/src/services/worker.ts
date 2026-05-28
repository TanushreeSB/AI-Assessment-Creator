import { dbService } from '../config/db';
import { aiService } from './ai.service';
import { pdfService } from './pdf.service';
import { wsService } from './websocket.service';
import fs from 'fs';

export async function processAssignmentGeneration(assignmentId: string): Promise<void> {
  console.log(`[Worker] Started processing assignment: ${assignmentId}`);

  try {
    // 1. Fetch assignment
    const assignment = await dbService.getAssignmentById(assignmentId);
    if (!assignment) {
      console.error(`[Worker] Assignment not found: ${assignmentId}`);
      return;
    }

    // 2. Set status to generating
    await dbService.updateAssignment(assignmentId, {
      status: 'generating',
      progress: 10
    });
    wsService.sendProgress(assignmentId, 'Initializing generation job...', 10);

    // 3. Extract file content if a text/pdf file was uploaded
    let fileContent = '';
    if (assignment.fileUrl) {
      try {
        // Just as an example, if they uploaded a text file we can read it.
        // For a full system, you would parse PDF or DOCX text.
        const localPath = assignment.fileUrl.replace(/^\/uploads\//, 'public/uploads/');
        if (fs.existsSync(localPath) && localPath.endsWith('.txt')) {
          fileContent = fs.readFileSync(localPath, 'utf-8');
          console.log(`[Worker] Read file context of length ${fileContent.length}`);
        }
      } catch (fileErr) {
        console.warn('[Worker] Failed to read uploaded file context:', fileErr);
      }
    }

    // 4. Update progress
    await dbService.updateAssignment(assignmentId, { progress: 30 });
    wsService.sendProgress(assignmentId, 'Generating structured questions using AI...', 30);

    // 5. Call AI generation
    console.log(`[Worker] Generating questions for: "${assignment.title}"`);
    const generatedPaper = await aiService.generateQuestions(
      assignment.title,
      assignment.questionTypes,
      assignment.additionalInstructions,
      fileContent
    );

    // 6. Update progress
    await dbService.updateAssignment(assignmentId, { progress: 70 });
    wsService.sendProgress(assignmentId, 'AI questions generated. Compiling PDF examination paper...', 70);

    // 7. Temporary mock updated assignment to pass to PDF generator
    const tempAssignment = {
      ...assignment,
      sections: generatedPaper.sections,
      answerKey: generatedPaper.answerKey
    };

    // 8. Generate PDF
    console.log('[Worker] Compiling PDF...');
    const pdfPath = await pdfService.generateAssignmentPDF(tempAssignment);

    // 9. Complete job and update DB
    await dbService.updateAssignment(assignmentId, {
      status: 'completed',
      progress: 100,
      sections: generatedPaper.sections,
      answerKey: generatedPaper.answerKey,
      pdfPath: pdfPath
    });

    console.log(`[Worker] Successfully completed assignment generation for: ${assignmentId}`);
    wsService.sendProgress(assignmentId, 'Completed', 100, { pdfPath });

  } catch (error: any) {
    console.error(`[Worker] Error processing assignment ${assignmentId}:`, error);
    
    await dbService.updateAssignment(assignmentId, {
      status: 'failed',
      progress: 0
    });
    
    wsService.sendProgress(assignmentId, `Generation failed: ${error.message || error}`, 0);
  }
}
