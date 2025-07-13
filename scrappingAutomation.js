import puppeteer from 'puppeteer';
import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Action types
const ACTION_TYPES = {
  CLICK: 'click',
  TYPE: 'type',
  NAVIGATION: 'navigation',
  SELECT: 'select',
  SCREENSHOT: 'screenshot',
  SCROLL: 'scroll',
  WAIT: 'wait',
  TEXT_SELECTION: 'text_selection' // New action type for text selection
};

// Records user actions
class ActionRecorder {
  constructor() {
    this.actions = [];
    this.startTime = null;
    this.recording = false;
  }

  startRecording() {
    this.actions = [];
    this.startTime = Date.now();
    this.recording = true;
    console.log('Recording started...');
  }

  stopRecording() {
    this.recording = false;
    console.log('Recording stopped.');
    return this.actions;
  }

  recordAction(type, data) {
    if (!this.recording) return;
    
    const timestamp = Date.now() - this.startTime;
    
    const action = {
      type,
      timestamp,
      data
    };
    
    this.actions.push(action);
    console.log(`Recorded action: ${type}`);
  }

  saveRecording(filename) {
    fs.writeFileSync(filename, JSON.stringify(this.actions, null, 2));
    console.log(`Recording saved to ${filename}`);
  }

  loadRecording(filename) {
    const data = fs.readFileSync(filename, 'utf8');
    this.actions = JSON.parse(data);
    console.log(`Loaded ${this.actions.length} actions from ${filename}`);
    return this.actions;
  }
}

// Main function to run the script
async function main() {
  rl.question('Enter URL to visit: ', async (url) => {
    const recorder = new ActionRecorder();
    const browser = await puppeteer.launch({ 
      executablePath: '/usr/bin/google-chrome',
      headless: false, // Set to false to see the browser
      defaultViewport: null,
      args: ['--start-maximized'] // Start with maximized window
    });
    
    const page = await browser.newPage();
    
    // Setup page event listeners
    await setupEventListeners(page, recorder);

    recorder.startRecording();
    
    // Navigate to the URL
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2' });
    recorder.recordAction(ACTION_TYPES.NAVIGATION, { url });
    
    console.log('\n----- Web Action Recorder -----');
    console.log('R: Start/Stop recording');
    console.log('S: Take screenshot');
    console.log('W: Wait for 2 seconds');
    console.log('P: Replay recorded actions');
    console.log('X: Save recording to file');
    console.log('L: Load recording from file');
    console.log('Q: Quit');
    console.log('------------------------------\n');
    
    // Start recording automatically
    
    // Command interface
    rl.on('line', async (input) => {
      const command = input.trim().toLowerCase();
      
      switch (command) {
        case 'r':
          if (recorder.recording) {
            recorder.stopRecording();
          } else {
            recorder.startRecording();
          }
          break;
          
        case 's':
          const screenshotPath = `screenshot-${Date.now()}.png`;
          await page.screenshot({ path: screenshotPath, fullPage: true });
          recorder.recordAction(ACTION_TYPES.SCREENSHOT, { path: screenshotPath });
          console.log(`Screenshot saved to ${screenshotPath}`);
          break;
          
        case 'w':
          console.log('Waiting for 2 seconds...');
          recorder.recordAction(ACTION_TYPES.WAIT, { duration: 2000 });
          await page.waitFor(2000);
          break;
          
        case 'p':
          console.log('Replaying recorded actions...');
          await replayActions(browser, recorder.actions);
          break;
          
        case 'x':
          rl.question('Enter filename to save recording: ', (filename) => {
            recorder.saveRecording(filename);
          });
          break;
          
        case 'l':
          rl.question('Enter filename to load recording: ', (filename) => {
            recorder.loadRecording(filename);
          });
          break;
          
        case 'q':
          console.log('Quitting...');
          await browser.close();
          rl.close();
          break;
          
        default:
          console.log('Unknown command');
      }
    });
  });
}

// Set up event listeners on the page
async function setupEventListeners(page, recorder) {
  // Listen for clicks
  await page.exposeFunction('recordClick', async (x, y, selector) => {
    recorder.recordAction(ACTION_TYPES.CLICK, { x, y, selector });
  });
  
  // Listen for typing
  await page.exposeFunction('recordType', async (selector, text) => {
    recorder.recordAction(ACTION_TYPES.TYPE, { selector, text });
  });
  
  // Listen for navigation
  await page.exposeFunction('recordNavigation', async (url) => {
    recorder.recordAction(ACTION_TYPES.NAVIGATION, { url });
  });
  
  // Listen for scroll
  await page.exposeFunction('recordScroll', async (x, y) => {
    recorder.recordAction(ACTION_TYPES.SCROLL, { x, y });
  });
  
  // Listen for select
  await page.exposeFunction('recordSelect', async (selector, value) => {
    recorder.recordAction(ACTION_TYPES.SELECT, { selector, value });
  });
  
  // Listen for text selection
  await page.exposeFunction('recordTextSelection', async (selector, selectedText) => {
    recorder.recordAction(ACTION_TYPES.TEXT_SELECTION, { selector, selectedText });
  });

  // Record all navigations including full page loads
  // await page.on('framenavigated', (frame) => {
  //   if (frame === page.mainFrame()) {
  //     recorder.recordAction(ACTION_TYPES.NAVIGATION, { url: frame.url() });
  //   }
  // });

  
  // Inject scripts to record events
  await page.evaluateOnNewDocument(() => {
    // Record clicks
    document.addEventListener('click', (event) => {
      const selector = getSelector(event.target);
      window.recordClick(event.clientX, event.clientY, selector);
    }, true);
    
    // Record input
    document.addEventListener('change', (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        const selector = getSelector(event.target);
        window.recordType(selector, event.target.value);
      } else if (event.target.tagName === 'SELECT') {
        const selector = getSelector(event.target);
        window.recordSelect(selector, event.target.value);
      }
    }, true);
    
    // Record navigation
    window.addEventListener('popstate', () => {
      window.recordNavigation(window.location.href);
    });
    
    // Record scroll with debounce
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        window.recordScroll(window.scrollX, window.scrollY);
      }, 300);
    });
    
    // Record text selection
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      if (selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;
        const selector = getSelector(element);
        
        window.recordTextSelection(selector, selection.toString());
      }
    });
    
    // Helper function to generate a unique selector for an element
    function getSelector(element) {
      if (element.id) {
        return `#${element.id}`;
      }
      
      if (element.className && typeof element.className === 'string') {
        const classes = element.className.split(' ').filter(c => c.trim() !== '');
        if (classes.length > 0) {
          return `.${classes.join('.')}`;
        }
      }
      
      // Path-based selector as fallback
      const path = [];
      let current = element;
      while (current && current.tagName) {
        let selector = current.tagName.toLowerCase();
        if (current.parentNode) {
          const siblings = Array.from(current.parentNode.children).filter(c => c.tagName === current.tagName);
          if (siblings.length > 1) {
            const index = siblings.indexOf(current) + 1;
            selector += `:nth-child(${index})`;
          }
        }
        path.unshift(selector);
        current = current.parentNode;
      }
      
      return path.join(' > ');
    }
  });
}

// Replay recorded actions
async function replayActions(browser, actions) {
  if (!actions || actions.length === 0) {
    console.log('No actions to replay');
    return;
  }
  
  console.log(`Replaying ${actions.length} actions...`);
  
  const page = await browser.newPage();
  
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const nextAction = actions[i + 1];
    
    console.log(`Replaying action: ${action.type}`);
    
    try {
      switch (action.type) {
        case ACTION_TYPES.NAVIGATION:
          await page.goto(action.data.url, { waitUntil: 'networkidle2' });
          break;
          
        case ACTION_TYPES.CLICK:
          try {
            // Try to use selector if available
            if (action.data.selector) {
              await page.waitForSelector(action.data.selector, { timeout: 5000, visible: true });
              await page.click(action.data.selector);
            } else {
              // Fall back to coordinates
              await page.mouse.click(action.data.x, action.data.y);
            }
          } catch (error) {
            console.log(`Error clicking element: ${error.message}`);
            // Fall back to coordinates
            await page.mouse.click(action.data.x, action.data.y);
          }
          break;
          
        case ACTION_TYPES.TYPE:
          await page.waitForSelector(action.data.selector, { timeout: 5000, visible: true });
          await page.type(action.data.selector, action.data.text);
          break;
          
        case ACTION_TYPES.SELECT:
          await page.waitForSelector(action.data.selector, { timeout: 5000, visible: true });
          await page.select(action.data.selector, action.data.value);
          break;
          
        case ACTION_TYPES.SCROLL:
          await page.evaluate((x, y) => {
            window.scrollTo(x, y);
          }, action.data.x, action.data.y);
          break;
          
        case ACTION_TYPES.WAIT:
          await page.waitFor(action.data.duration);
          break;
          
        case ACTION_TYPES.SCREENSHOT:
          await page.screenshot({ path: `replay-${Date.now()}.png`, fullPage: true });
          break;
          
        case ACTION_TYPES.TEXT_SELECTION:
          // For text selection, we'll highlight the text during replay
          await page.waitForSelector(action.data.selector, { timeout: 5000, visible: true });
          
          await page.evaluate((selector, text) => {
            const element = document.querySelector(selector);
            if (element) {
              // Find the text node that contains our text
              const findTextNodeWithString = (node, searchText) => {
                if (node.nodeType === Node.TEXT_NODE && node.textContent.includes(searchText)) {
                  return node;
                }
                
                for (const child of node.childNodes) {
                  const result = findTextNodeWithString(child, searchText);
                  if (result) return result;
                }
                
                return null;
              };
              
              const textNode = findTextNodeWithString(element, text);
              
              if (textNode) {
                const range = document.createRange();
                const startIndex = textNode.textContent.indexOf(text);
                
                range.setStart(textNode, startIndex);
                range.setEnd(textNode, startIndex + text.length);
                
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
              }
            }
          }, action.data.selector, action.data.selectedText);
          
          // Add a small delay to see the selection
          await page.waitFor(1000);
          break;
      }
      
      // Calculate wait time to next action
      if (nextAction) {
        const waitTime = nextAction.timestamp - action.timestamp;
        if (waitTime > 0) {
          await page.waitFor(Math.min(waitTime, 5000)); // Cap at 5 seconds
        }
      }
      
    } catch (error) {
      console.error(`Error replaying action ${action.type}: ${error.message}`);
    }
  }
  
  console.log('Replay completed');
}

// Run the main function
main().catch(error => {
  console.error('An error occurred:', error);
});