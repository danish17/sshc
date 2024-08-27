import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';
import { spawn } from 'child_process';
import autocompletePrompt from 'inquirer-autocomplete-prompt';
import { formatChoiceOptions, generateTable } from './lib/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

inquirer.registerPrompt('autocomplete', autocompletePrompt);

const filePath = path.join(__dirname, 'data', 'ssh.json');

class SSHManager {
  constructor() {
    this.commands = {
      add: {
        func: () => this.addEntry(),
        help: 'Adds a new SSH connection entry.',
      },
      remove: {
        func: () => this.removeEntry(),
        help: 'Removes an existing SSH connection entry.',
      },
      modify: {
        func: () => this.modifyEntry(),
        help: 'Modifies an existing SSH connection entry.',
      },
      list: {
        func: () => this.listConnections(),
        help: 'Lists all SSH connections.',
      },
      'config-location': {
        func: () => this.showConfigLocation(),
        help: 'Displays the location of the config file.',
      },
      version: {
        func: () => this.showVersion(),
        help: 'Displays the version of the application.',
        aliases: ['-v'],
      },
    };

    // Bind all methods to this instance
    Object.getOwnPropertyNames(SSHManager.prototype).forEach((key) => {
      if (typeof this[key] === 'function' && key !== 'constructor') {
        this[key] = this[key].bind(this);
      }
    });
  }

  ensureDirectoryExists() {
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
  }

  readData(callback) {
    this.ensureDirectoryExists();
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        const defaultContent = JSON.stringify({});
        fs.writeFile(filePath, defaultContent, 'utf8', (writeErr) => {
          if (writeErr) {
            console.error(`Error creating file at [${filePath}]: ${writeErr}`);
            return;
          }
          this.readFileContent(callback);
        });
      } else {
        this.readFileContent(callback);
      }
    });
  }

  readFileContent(callback) {
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

  writeData(data) {
    this.ensureDirectoryExists();
    fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
      if (err) {
        console.error('An error occurred during file writing:', err);
      }
    });
  }

  addEntry() {
    inquirer
      .prompt([
        { type: 'input', name: 'key', message: 'Enter the label:' },
        { type: 'input', name: 'username', message: 'Username:' },
        { type: 'input', name: 'hostname', message: 'Hostname (IP address):' },
      ])
      .then((answers) => {
        this.readData((data) => {
          data[answers.key] = {
            username: answers.username,
            hostname: answers.hostname,
          };
          this.writeData(data);
          console.log('The connection was added successfully.');
          this.listConnections();
        });
      });
  }

  removeEntry() {
    this.readData((data) => {
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
          this.writeData(data);
          console.log('The connection was removed successfully.');
          this.listConnections();
        });
    });
  }

  modifyEntry() {
    this.readData((data) => {
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
          this.writeData(data);
          console.log('The connection was modified successfully.');
        });
    });
  }

  listConnections() {
    this.readData((data) => {
      console.log(generateTable(data));
    });
  }

  showConfigLocation() {
    console.log(`Config file location: ${filePath}`);
  }

  showVersion() {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'),
    );
    console.log(`sshc version ${packageJson.version}`);
  }

  sshIntoHost() {
    this.readData((data) => {
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

  mainMenu() {
    const args = process.argv.slice(2);
    const commandName = args[0]?.replace(/^-+/, '');

    if (commandName === 'help' || args.includes('-h')) {
      if (args[1] && this.commands[args[1]]) {
        console.log(this.commands[args[1]].help);
      } else {
        console.log('Available commands:');
        Object.entries(this.commands).forEach(([name, { help, aliases }]) => {
          console.log(
            `  ${name}${aliases ? ` (${aliases.join(', ')})` : ''}: ${help}`,
          );
        });
      }
    } else if (this.commands[commandName]) {
      this.commands[commandName].func();
    } else {
      this.sshIntoHost();
    }
  }
}

const sshManager = new SSHManager();
export const mainMenu = sshManager.mainMenu.bind(sshManager);
