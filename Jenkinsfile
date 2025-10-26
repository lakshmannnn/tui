 pipeline {
    agent any
    tools {nodejs "node"}
    stages {
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