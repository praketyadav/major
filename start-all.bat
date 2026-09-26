@echo off
echo Starting Recruitr Platform...

echo 1/4: Starting Auth Service...
start "Auth Service" cmd /k "cd recruitr-auth-service && mvn spring-boot:run"
:: Wait 10 seconds to give Auth time to initialize
timeout /t 10

echo 2/4: Starting Core Backend Services...
start "Drive Service" cmd /k "cd recruitr-drive-service && mvn spring-boot:run"
start "Enrollment Service" cmd /k "cd recruitr-enrollment-service && mvn spring-boot:run"
start "Exam Service" cmd /k "cd recruitr-exam-service && mvn spring-boot:run"
start "Results Service" cmd /k "cd recruitr-results-service && mvn spring-boot:run"
:: Wait 15 seconds for core services to register
timeout /t 15

echo 3/4: Starting API Gateway...
start "API Gateway" cmd /k "cd recruitr-gateway && mvn spring-boot:run"

echo 4/4: Starting React Frontend...
start "Frontend" cmd /k "cd recruitr-frontend && npm run dev"

echo All services are booting up in separate windows!
