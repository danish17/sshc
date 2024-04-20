# SSH Connection Manager
Developed as a personal project, this utility focuses on handling the storage, modification, and selection of SSH connection details without storing passwords.

# Features
- SSH into Hosts
- Read and Write SSH Connection Data
- Interactive Command Interface
- Connection Listing
- Add, Remove, and Modify Connections

# Dependencies
- fs: Node.js file system module for reading and writing files.
- inquirer: A collection of common interactive command line user interfaces.
- child_process: Used to spawn child processes, in this case, to initiate SSH sessions.
- cli-table3: Renders Unicode-aided tables on the command line.
- inquirer-autocomplete-prompt: An inquirer plugin for autocompleting input based on existing entries.

# Installation and Setup
1. Ensure that Node.js is installed on your machine.
2. Clone this repository or download the source code.
3. Install the necessary npm packages by running npm install.
4. Configure the file path in the script to point to your ssh.json file containing the SSH connection data.

# Usage
The application supports several command-line arguments for different operations:

- `--add`: Adds a new SSH connection.
- `--remove`: Removes an existing SSH connection.
- `--modify`: Modifies an existing SSH connection.
- `--list`: Lists all stored SSH connections.

No argument: Connects via SSH to a chosen host.