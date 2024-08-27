import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { spawn } from 'child_process';
import Table from 'cli-table3';
import autocompletePrompt from 'inquirer-autocomplete-prompt';

inquirer.registerPrompt('autocomplete', autocompletePrompt);

const filePath = path.join(process.cwd(), 'data', 'ssh.json');

function ensureDirectoryExists() {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function readData(callback) {
  ensureDirectoryExists();
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      const defaultContent = JSON.stringify({});
      fs.writeFile(filePath, defaultContent, 'utf8', (writeErr) => {
        if (writeErr) {
          console.error(`Error creating file at [${filePath}]: ${writeErr}`);
          return;
        }
        readFileContent(callback);
      });
    } else {
      readFileContent(callback);
    }
  });
}

function readFileContent(callback) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(
        `An error was encountered while reading the file at [${filePath}]: ${err}`,
      );
      return;
    }
    callback(JSON.parse(data));
  });
}

function writeData(data) {
  ensureDirectoryExists();
  fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error('An error occurred during file writing:', err);
    }
  });
}

function formatChoiceOptions(data, filter = '') {
  const keys = Object.keys(data).filter((key) =>
    key.toLowerCase().includes(filter.toLowerCase()),
  );
  const maxLabelLength = Math.max(
    ...keys.map((key) => key.length),
    'Label'.length,
  );

  return keys.map((key) => {
    const label = key.padEnd(maxLabelLength);
    const username = data[key].username;
    const hostname = data[key].hostname;
    return {
      name: `${label} (${username}@${hostname})`,
      value: key,
    };
  });
}

function generateTable(data) {
  const chars = {
    top: '═',
    'top-mid': '╤',
    'top-left': '╔',
    'top-right': '╗',
    bottom: '═',
    'bottom-mid': '╧',
    'bottom-left': '╚',
    'bottom-right': '╝',
    left: '║',
    'left-mid': '╟',
    mid: '─',
    'mid-mid': '┼',
    right: '║',
    'right-mid': '╢',
    middle: '│',
  };

  const table = new Table({
    head: ['Label', 'Username', 'Hostname'],
    chars: chars,
  });

  Object.keys(data).forEach((key) => {
    table.push([key, data[key].username, data[key].hostname]);
  });

  return table.toString();
}

function addEntry() {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'key',
        message: 'Enter the label:',
      },
      {
        type: 'input',
        name: 'username',
        message: 'Username:',
      },
      {
        type: 'input',
        name: 'hostname',
        message: 'Hostname (IP address):',
      },
    ])
    .then((answers) => {
      readData((data) => {
        data[answers.key] = {
          username: answers.username,
          hostname: answers.hostname,
        };
        writeData(data);
        console.log('The connection was added successfully.');
        listConnections();
      });
    });
}

function removeEntry() {
  readData((data) => {
    inquirer
      .prompt([
        {
          type: 'autocomplete',
          name: 'key',
          message: 'Select the connection you wish to remove:',
          source: (_answers, input) =>
            Promise.resolve(formatChoiceOptions(data, input)),
        },
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to remove this connection?',
        },
      ])
      .then((answer) => {
        if (!answer.confirm) return;
        delete data[answer.key];
        writeData(data);
        console.log('The connection was removed successfully.');
        listConnections();
      });
  });
}

function modifyEntry() {
  readData((data) => {
    inquirer
      .prompt([
        {
          type: 'autocomplete',
          name: 'key',
          message: 'Select the connection to modify:',
          source: (answers, input) =>
            Promise.resolve(formatChoiceOptions(data, input)),
        },
        {
          type: 'input',
          name: 'newUsername',
          message: 'New username:',
          default: (answers) => data[answers.key].username,
        },
        {
          type: 'input',
          name: 'newHostname',
          message: 'New hostname (IP address):',
          default: (answers) => data[answers.key].hostname,
        },
      ])
      .then((answers) => {
        data[answers.key] = {
          username: answers.newUsername,
          hostname: answers.newHostname,
        };
        writeData(data);
        console.log('The connection was modified successfully.');
      });
  });
}

function listConnections() {
  readData((data) => {
    console.log(generateTable(data));
  });
}

function sshIntoHost() {
  readData((data) => {
    inquirer
      .prompt([
        {
          type: 'autocomplete',
          name: 'key',
          message: 'Choose the host connection you wish to SSH into:',
          source: (answers, input) =>
            Promise.resolve(formatChoiceOptions(data, input)),
        },
      ])
      .then((answers) => {
        const entry = data[answers.key];
        console.log(
          `Attempting to connect: ssh ${entry.username}@${entry.hostname}`,
        );
        spawn('ssh', [`${entry.username}@${entry.hostname}`], {
          stdio: 'inherit',
        });
      });
  });
}

function showConfigLocation() {
  console.log(`Config file location: ${filePath}`);
}

function mainMenu() {
  const args = process.argv.slice(2);
  if (args.includes('--add')) {
    addEntry();
  } else if (args.includes('--remove')) {
    removeEntry();
  } else if (args.includes('--modify')) {
    modifyEntry();
  } else if (args.includes('--list')) {
    listConnections();
  } else if (args.includes('--config-location')) {
    showConfigLocation();
  } else {
    sshIntoHost();
  }
}

export { mainMenu };
