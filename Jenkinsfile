node {

    try {
        docker.withRegistry('https://localhost:5001') {
            stage('Build') {
                checkout scm
                image = docker.build("ouvalargent/web:${env.BUILD_ID}", ".")
            }
            stage('Test') {

            }
            stage('Push') {
                image.push('latest')
            }
        }
    }

    catch (err) {
        echo "Build failed :face_with_head_bandage: \n`${env.JOB_NAME}#${env.BUILD_NUMBER}` <${env.BUILD_URL}|Open in Jenkins>"
        throw err
    }

}
