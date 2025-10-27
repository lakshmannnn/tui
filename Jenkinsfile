 pipeline {
    agent any
    tools {nodejs "node"}
    stages {
        stage('seed persistent context') {
                    steps {
                           script {
                                bat 'set CHROME_PATH="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" && npm run seed'
                                }
                    }
                }
        stage('install dependencies') {
                    steps {
                        git url: 'https://github.com/lakshmannnn/tui.git'
                        bat 'npm install'
                        bat 'npm update'
                    }
                }
		stage('trigger tests') {

                    steps {
                        bat 'npm run test:headed'
                    }
                }
        }
    }
