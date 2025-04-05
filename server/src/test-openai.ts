import dotenv from 'dotenv';
import openaiService from './services/openai.service';

// Load environment variables
dotenv.config();

// Sample Hebrew email content
const hebrewEmailSample = `
שלום רב,

אני צריך שתכין את המצגת לפגישה שלנו ביום שלישי הבא, 2023-09-05. 

המצגת צריכה לכלול:
1. סקירה של תוצאות הרבעון האחרון
2. התקדמות בפרויקטים העיקריים
3. יעדים לרבעון הבא

חשוב מאוד שנקבל את הנתונים מהמחלקות השונות עד סוף השבוע כדי שנוכל להכין מצגת מקיפה.

בברכה,
דניאל
`;

// Sample English email content
const englishEmailSample = `
Hello,

I need you to prepare the presentation for our meeting next Tuesday, 2023-09-05.

The presentation should include:
1. Overview of last quarter's results
2. Progress on key projects
3. Goals for the next quarter

It's very important that we receive the data from the different departments by the end of the week so we can prepare a comprehensive presentation.

Best regards,
Daniel
`;

// Function to test OpenAI integration
async function testOpenAIIntegration() {
  console.log('Testing OpenAI integration with the provided API key...');
  
  // Test 1: Extract tasks from Hebrew email
  console.log('\n--- Test 1: Extract tasks from Hebrew email ---');
  try {
    const hebrewResult = await openaiService.extractTaskFromEmail(
      hebrewEmailSample,
      'מצגת לפגישה',
      'he'
    );
    console.log('Result:', JSON.stringify(hebrewResult, null, 2));
  } catch (error) {
    console.error('Error testing Hebrew email extraction:', error);
  }
  
  // Test 2: Extract tasks from English email
  console.log('\n--- Test 2: Extract tasks from English email ---');
  try {
    const englishResult = await openaiService.extractTaskFromEmail(
      englishEmailSample,
      'Presentation for meeting',
      'en'
    );
    console.log('Result:', JSON.stringify(englishResult, null, 2));
  } catch (error) {
    console.error('Error testing English email extraction:', error);
  }
  
  // Test 3: Analyze task priority (Hebrew)
  console.log('\n--- Test 3: Analyze task priority (Hebrew) ---');
  try {
    const priorityResult = await openaiService.analyzeTaskPriority(
      'הכנת מצגת לפגישה',
      'הכנת מצגת מקיפה עם נתונים מכל המחלקות',
      '2023-09-05',
      'he'
    );
    console.log('Result:', JSON.stringify(priorityResult, null, 2));
  } catch (error) {
    console.error('Error testing task priority analysis:', error);
  }
  
  // Test 4: Generate follow-up email (Hebrew)
  console.log('\n--- Test 4: Generate follow-up email (Hebrew) ---');
  try {
    const emailResult = await openaiService.generateFollowupEmail(
      'הכנת מצגת לפגישה',
      'הכנת מצגת מקיפה עם נתונים מכל המחלקות',
      '2023-09-05',
      'משה',
      1,
      'he'
    );
    console.log('Result:', JSON.stringify(emailResult, null, 2));
  } catch (error) {
    console.error('Error testing follow-up email generation:', error);
  }
}

// Run the tests
testOpenAIIntegration()
  .then(() => {
    console.log('\nOpenAI integration tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error running OpenAI integration tests:', error);
    process.exit(1);
  }); 