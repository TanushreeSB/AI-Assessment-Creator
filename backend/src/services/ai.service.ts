import { GoogleGenAI } from '@google/generative-ai';

// Initialize Gemini API if key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: any = null;

if (apiKey && apiKey !== 'your_gemini_api_key_here') {
  try {
    // Note: The new SDK interface usually uses standard GoogleGenAI or GoogleGenerativeAI
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    aiClient = new GoogleGenerativeAI(apiKey);
    console.log('Gemini AI Client initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Gemini AI client:', error);
  }
} else {
  console.log('No GEMINI_API_KEY found. Running in Mock AI generation mode.');
}

interface QuestionTypeConfig {
  type: string;
  count: number;
  marks: number;
}

export interface GeneratedExam {
  sections: Array<{
    title: string;
    instruction: string;
    questions: Array<{
      questionText: string;
      difficulty: 'easy' | 'medium' | 'hard';
      marks: number;
    }>;
  }>;
  answerKey: Array<{
    questionNumber: string;
    answerText: string;
  }>;
}

class AIService {
  async generateQuestions(
    title: string,
    questionTypes: QuestionTypeConfig[],
    additionalInstructions?: string,
    fileContent?: string
  ): Promise<GeneratedExam> {
    if (aiClient) {
      try {
        return await this.generateWithGemini(title, questionTypes, additionalInstructions, fileContent);
      } catch (err) {
        console.error('Gemini generation failed, falling back to mock generator:', err);
        return this.generateMockQuestions(title, questionTypes);
      }
    } else {
      // Simulate delay for realism
      await new Promise(resolve => setTimeout(resolve, 3000));
      return this.generateMockQuestions(title, questionTypes);
    }
  }

  private async generateWithGemini(
    title: string,
    questionTypes: QuestionTypeConfig[],
    additionalInstructions?: string,
    fileContent?: string
  ): Promise<GeneratedExam> {
    const model = aiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const questionTypesPrompt = questionTypes
      .map(qt => `- Type: ${qt.type}, Count: ${qt.count} questions, Marks per question: ${qt.marks}`)
      .join('\n');

    const prompt = `
You are an expert curriculum developer. Generate a highly professional, school/college level assessment question paper based on the following details:

Assessment Title/Topic: ${title}

Question Types and Allocations required:
${questionTypesPrompt}

${additionalInstructions ? `Additional Instructions for the test generator: ${additionalInstructions}` : ''}
${fileContent ? `Context document content to base the questions on: \n${fileContent}` : ''}

You must respond in strict JSON format matching the following typescript schema:
{
  "sections": Array<{
    "title": string, // Section Header, e.g., "Section A: Multiple Choice Questions"
    "instruction": string, // Instructions for this section, e.g., "Attempt all questions. Choose the correct option."
    "questions": Array<{
      "questionText": string, // The actual question. For MCQ, include the options A, B, C, D in the questionText.
      "difficulty": "easy" | "medium" | "hard", // Distribute difficulty realistically (e.g. 40% easy, 40% medium, 20% hard)
      "marks": number // Marks for this question
    }>
  }>,
  "answerKey": Array<{
    "questionNumber": string, // Label like "1", "2", "3.A", etc.
    "answerText": string // Detailed answer or correct option with explanation
  }>
}

Ensure:
1. The JSON is perfectly valid and can be parsed directly in Node.js.
2. Do not wrap the JSON output in markdown quotes (do not use \`\`\`json ... \`\`\`), just return the raw JSON string.
3. Every question requested is generated and matches the marks requested.
4. Total marks should sum up correctly.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Clean response in case LLM wraps it in markdown blocks
    const cleanedText = text
      .replace(/```json/i, '')
      .replace(/```/g, '')
      .trim();

    return JSON.parse(cleanedText) as GeneratedExam;
  }

  private generateMockQuestions(title: string, questionTypes: QuestionTypeConfig[]): GeneratedExam {
    const isScience = /elect|volt|physics|chem|bio|science|cell|photosynth|water|atom/i.test(title);
    const isMath = /math|algebra|geometry|fraction|calc|num|sum|stat/i.test(title);
    const isHistory = /history|war|revol|king|empire|india|world/i.test(title);

    let topic = 'General Knowledge';
    if (isScience) topic = 'Science';
    if (isMath) topic = 'Mathematics';
    if (isHistory) topic = 'History';

    const mockDatabases: Record<string, { easy: string[], medium: string[], hard: string[], answers: Record<string, string> }> = {
      Science: {
        easy: [
          'What is the standard unit of electric current? (A) Volt (B) Ampere (C) Ohm (D) Watt',
          'Which component is used to open or close an electric circuit? (A) Resistor (B) Battery (C) Switch (D) Wire',
          'Which of the following is a good conductor of electricity? (A) Rubber (B) Glass (C) Copper (D) Plastic',
          'What pigment gives plants their green color? (A) Carotene (B) Chlorophyll (C) Xanthophyll (D) Anthocyanin',
          'Water boils at what temperature in Celsius? (A) 0°C (B) 50°C (C) 100°C (D) 200°C'
        ],
        medium: [
          'Explain the difference between a series circuit and a parallel circuit.',
          'Define Ohm\'s Law and write its mathematical formula.',
          'What is the role of a resistor in an electrical circuit, and how is resistance calculated?',
          'Describe the process of photosynthesis and list the main raw materials required.',
          'Explain why distilled water is a poor conductor of electricity, while tap water conducts it.'
        ],
        hard: [
          'A circuit has a resistance of 15 Ohms. If a current of 2 Amperes flows through it, calculate the potential difference and the total power dissipated.',
          'What happens during electrolysis at the anode and cathode when an electric current is passed through acidified water? Write the chemical equations.',
          'Describe how a semiconductor behaves differently from a conductor and an insulator under varying temperatures.',
          'Explain the concept of electromagnetic induction and how it is applied in AC generators.'
        ],
        answers: {
          'What is the standard unit of electric current? (A) Volt (B) Ampere (C) Ohm (D) Watt': '(B) Ampere. The Ampere (A) is the base unit of electric current in the International System of Units.',
          'Which component is used to open or close an electric circuit? (A) Resistor (B) Battery (C) Switch (D) Wire': '(C) Switch. A switch is a controller that makes or breaks the conductive path in a circuit.',
          'Which of the following is a good conductor of electricity? (A) Rubber (B) Glass (C) Copper (D) Plastic': '(C) Copper. Copper has free electrons that allow electric charge to flow through it easily.',
          'What pigment gives plants their green color? (A) Carotene (B) Chlorophyll (C) Xanthophyll (D) Anthocyanin': '(B) Chlorophyll. Chlorophyll absorbs blue and red wavelengths of light and reflects green light.',
          'Water boils at what temperature in Celsius? (A) 0°C (B) 50°C (C) 100°C (D) 200°C': '(C) 100°C. Under standard atmospheric pressure, water boils at 100 degrees Celsius.',
          'Explain the difference between a series circuit and a parallel circuit.': 'In a series circuit, all components are connected in a single loop, so the same current flows through all of them. In a parallel circuit, components are connected along multiple branches, meaning the voltage across each component is equal, and the current splits among the branches.',
          'Define Ohm\'s Law and write its mathematical formula.': 'Ohm\'s Law states that the current flowing through a conductor between two points is directly proportional to the voltage across the two points, provided the temperature remains constant. Formula: V = I * R, where V is voltage, I is current, and R is resistance.',
          'What is the role of a resistor in an electrical circuit, and how is resistance calculated?': 'A resistor limits or regulates the flow of electrical current in a circuit. Resistance is calculated using Ohm\'s Law as R = V / I. It is measured in Ohms (Ω).',
          'Describe the process of photosynthesis and list the main raw materials required.': 'Photosynthesis is the process by which green plants use sunlight, carbon dioxide, and water to synthesize glucose (food) and release oxygen. Raw materials: carbon dioxide (absorbed from air), water (absorbed from soil), and sunlight (trapped by chlorophyll).',
          'Explain why distilled water is a poor conductor of electricity, while tap water conducts it.': 'Distilled water is pure and contains no dissolved mineral salts or ions, which are needed to carry an electric charge. Tap water contains dissolved minerals and salts that dissociate into free ions, allowing electric current to flow.',
          'A circuit has a resistance of 15 Ohms. If a current of 2 Amperes flows through it, calculate the potential difference and the total power dissipated.': '1) Potential Difference (V): V = I * R = 2 A * 15 Ω = 30 Volts. 2) Power Dissipated (P): P = V * I = 30 V * 2 A = 60 Watts (or P = I² * R = 2² * 15 = 60W).',
          'What happens during electrolysis at the anode and cathode when an electric current is passed through acidified water? Write the chemical equations.': 'During electrolysis: 1) At the Cathode (negative electrode), hydrogen ions gain electrons to form hydrogen gas: 2H⁺ + 2e⁻ -> H₂. 2) At the Anode (positive electrode), water is oxidized to form oxygen gas and hydrogen ions: 2H₂O -> O₂ + 4H⁺ + 4e⁻. Ratio of H₂ to O₂ gas produced is 2:1 by volume.',
          'Describe how a semiconductor behaves differently from a conductor and an insulator under varying temperatures.': 'A conductor\'s resistance increases with temperature. An insulator does not conduct at normal temperatures. A semiconductor\'s conductivity increases (resistance decreases) as temperature rises because thermal energy excites electrons from the valence band to the conduction band.',
          'Explain the concept of electromagnetic induction and how it is applied in AC generators.': 'Electromagnetic induction is the production of an electromotive force (voltage) across a electrical conductor in a changing magnetic field. In an AC generator, a wire coil is rotated inside a magnetic field. As the coil rotates, the magnetic flux passing through it changes continuously, inducing an alternating electric current.'
        }
      },
      Mathematics: {
        easy: [
          'Solve for x: 2x + 5 = 15. (A) 3 (B) 5 (C) 10 (D) 15',
          'What is the area of a rectangle with length 8cm and width 5cm? (A) 13 cm² (B) 30 cm² (C) 40 cm² (D) 80 cm²',
          'What is the square root of 144? (A) 10 (B) 12 (C) 14 (D) 16'
        ],
        medium: [
          'Solve the quadratic equation: x² - 5x + 6 = 0.',
          'If the ratio of the angles of a triangle is 2:3:4, find the measure of each angle.',
          'A shopkeeper sells an item for $120, making a 20% profit. What was the cost price of the item?'
        ],
        hard: [
          'Prove that the sum of the angles in a quadrilateral is 360 degrees.',
          'In a circle, a chord of length 16 cm is drawn at a distance of 6 cm from the center. Find the radius of the circle.'
        ],
        answers: {
          'Solve for x: 2x + 5 = 15. (A) 3 (B) 5 (C) 10 (D) 15': '(B) 5. Subtract 5 from both sides: 2x = 10. Divide by 2: x = 5.',
          'What is the area of a rectangle with length 8cm and width 5cm? (A) 13 cm² (B) 30 cm² (C) 40 cm² (D) 80 cm²': '(C) 40 cm². Area = length * width = 8 * 5 = 40 cm².',
          'What is the square root of 144? (A) 10 (B) 12 (C) 14 (D) 16': '(B) 12. 12 * 12 = 144.',
          'Solve the quadratic equation: x² - 5x + 6 = 0.': 'Factor the quadratic equation: (x - 2)(x - 3) = 0. Therefore, the solutions are x = 2 and x = 3.',
          'If the ratio of the angles of a triangle is 2:3:4, find the measure of each angle.': 'Let the angles be 2x, 3x, and 4x. The sum of angles in a triangle is 180°. 2x + 3x + 4x = 180 => 9x = 180 => x = 20°. The angles are: 2(20)=40°, 3(20)=60°, and 4(20)=80°.',
          'A shopkeeper sells an item for $120, making a 20% profit. What was the cost price of the item?': 'Selling Price = Cost Price * (1 + Profit%). 120 = CP * 1.20 => CP = 120 / 1.20 = $100.',
          'Prove that the sum of the angles in a quadrilateral is 360 degrees.': 'Draw a diagonal dividing the quadrilateral into two triangles. The sum of angles in each triangle is 180 degrees. Thus, the sum of angles of the quadrilateral is 180° + 180° = 360°.',
          'In a circle, a chord of length 16 cm is drawn at a distance of 6 cm from the center. Find the radius of the circle.': 'The perpendicular from the center bisects the chord, forming two segments of 8 cm. Together with the radius and the distance of 6 cm, this forms a right-angled triangle. By Pythagoras theorem: Radius² = 6² + 8² = 36 + 64 = 100. Radius = 10 cm.'
        }
      },
      General: {
        easy: [
          'Which is the largest ocean on Earth? (A) Atlantic (B) Indian (C) Pacific (D) Arctic',
          'Who wrote the play "Romeo and Juliet"? (A) Charles Dickens (B) William Shakespeare (C) Mark Twain (D) Jane Austen',
          'What is the capital city of Japan? (A) Beijing (B) Seoul (C) Tokyo (D) Bangkok'
        ],
        medium: [
          'Name the three branches of government in the United States and describe their primary roles.',
          'Explain the term "inflation" in economics and how it impacts consumers.',
          'What was the main cause of the French Revolution, and when did it begin?'
        ],
        hard: [
          'Compare and contrast the political philosophies of Thomas Hobbes and John Locke regarding the social contract.',
          'Analyze the socio-economic impacts of the Industrial Revolution in Europe during the 19th century.'
        ],
        answers: {
          'Which is the largest ocean on Earth? (A) Atlantic (B) Indian (C) Pacific (D) Arctic': '(C) Pacific. The Pacific Ocean is the largest and deepest of Earth\'s oceanic divisions.',
          'Who wrote the play "Romeo and Juliet"? (A) Charles Dickens (B) William Shakespeare (C) Mark Twain (D) Jane Austen': '(B) William Shakespeare. Romeo and Juliet was written by William Shakespeare early in his career.',
          'What is the capital city of Japan? (A) Beijing (B) Seoul (C) Tokyo (D) Bangkok': '(C) Tokyo. Tokyo is the metropolitan capital of Japan.',
          'Name the three branches of government in the United States and describe their primary roles.': 'The three branches are: 1) Legislative (Congress, makes laws), 2) Executive (President, enforces laws), and 3) Judicial (Supreme Court, interprets laws). This separation ensures checks and balances.',
          'Explain the term "inflation" in economics and how it impacts consumers.': 'Inflation is the general increase in prices and fall in the purchasing value of money. For consumers, this means that goods cost more, reducing their purchasing power unless their income increases at the same rate.',
          'What was the main cause of the French Revolution, and when did it begin?': 'Key causes included severe financial crisis, social inequality of the Estate system, food shortages, and Enlightenment ideals. It began in 1789 with the storming of the Bastille.',
          'Compare and contrast the political philosophies of Thomas Hobbes and John Locke regarding the social contract.': 'Hobbes argued that humans in the state of nature are solitary and brutal, so they need a strong sovereign (Leviathan) to maintain order. Locke argued humans are rational and possess natural rights (life, liberty, property), and the government\'s role is to protect these rights, with citizens holding the right to revolt if it fails.',
          'Analyze the socio-economic impacts of the Industrial Revolution in Europe during the 19th century.': 'Impacts included: 1) Shift from agricultural to industrial economies. 2) Rapid urbanization, leading to crowded cities and poor living conditions. 3) Rise of the working class and labor movements. 4) Increased standard of living for the middle class but child labor and exploitation in factories.'
        }
      }
    };

    // Determine database based on topic
    const dbKey = (topic === 'Science' || topic === 'Mathematics') ? topic : 'General';
    const db = mockDatabases[dbKey];

    const sections: GeneratedExam['sections'] = [];
    const answerKey: GeneratedExam['answerKey'] = [];
    let questionCounter = 1;

    questionTypes.forEach((qt) => {
      const sectionQuestions: any[] = [];
      const count = qt.count;

      for (let i = 0; i < count; i++) {
        // Distribute difficulty
        let diff: 'easy' | 'medium' | 'hard' = 'medium';
        if (i % 3 === 0 && db.easy.length > 0) diff = 'easy';
        else if (i % 3 === 2 && db.hard.length > 0) diff = 'hard';

        // Select matching questions from mock DB
        const pool = db[diff];
        const index = (i + questionCounter) % pool.length;
        const qText = pool[index];
        const ansText = db.answers[qText] || 'Refer to classroom materials for the complete answer.';

        // Customize the mock question with the actual title if it fits
        let customizedText = qText;
        if (customizedText.includes('Explain') && !customizedText.toLowerCase().includes(title.toLowerCase())) {
          customizedText = `${customizedText} (Relating to ${title})`;
        }

        sectionQuestions.push({
          questionText: customizedText,
          difficulty: diff,
          marks: qt.marks
        });

        answerKey.push({
          questionNumber: `${questionCounter}`,
          answerText: ansText
        });

        questionCounter++;
      }

      sections.push({
        title: `Section ${String.fromCharCode(65 + sections.length)}: ${qt.type}`,
        instruction: `Answer all ${count} questions. Each question is worth ${qt.marks} mark(s).`,
        questions: sectionQuestions
      });
    });

    return {
      sections,
      answerKey
    };
  }
}

export const aiService = new AIService();
