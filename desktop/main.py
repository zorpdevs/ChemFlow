import sys
import os
import json
import requests
import pandas as pd
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, 
                             QHBoxLayout, QLabel, QLineEdit, QPushButton, 
                             QTableWidget, QTableWidgetItem, QFileDialog, 
                             QMessageBox, QTabWidget, QGroupBox, QHeaderView, QDialog)
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QFont
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure
import matplotlib.pyplot as plt

# Check for Google Auth Library
try:
    from google_auth_oauthlib.flow import InstalledAppFlow
    GOOGLE_AUTH_AVAILABLE = True
except ImportError:
    GOOGLE_AUTH_AVAILABLE = False
    print("Warning: google-auth-oauthlib not installed. Google Login will be disabled.")

# Configuration
API_BASE_URL = "http://127.0.0.1:8000/api/"
FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY")

if not FIREBASE_API_KEY:
    # Fallback or Error
    print("Warning: FIREBASE_API_KEY not found in .env")
    FIREBASE_API_KEY = "PLACEHOLDER_KEY" 

# Firebase REST API Endpoints
FIREBASE_SIGNUP_URL = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={FIREBASE_API_KEY}"
FIREBASE_SIGNIN_URL = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"
FIREBASE_IDP_URL = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key={FIREBASE_API_KEY}"

class RegisterDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Register Account")
        self.setFixedSize(300, 250)
        self.init_ui()

    def init_ui(self):
        layout = QVBoxLayout()
        
        layout.addWidget(QLabel("Email:"))
        self.email_input = QLineEdit()
        layout.addWidget(self.email_input)
        
        layout.addWidget(QLabel("Password:"))
        self.password_input = QLineEdit()
        self.password_input.setEchoMode(QLineEdit.Password)
        layout.addWidget(self.password_input)
        
        self.register_btn = QPushButton("Register")
        self.register_btn.clicked.connect(self.handle_register)
        self.register_btn.setStyleSheet("background-color: #10b981; color: white; padding: 5px;")
        layout.addWidget(self.register_btn)
        
        self.setLayout(layout)

    def handle_register(self):
        email = self.email_input.text()
        password = self.password_input.text()

        if not password or not email:
            QMessageBox.warning(self, "Error", "All fields are required")
            return

        try:
            # Firebase Sign Up
            payload = {
                "email": email,
                "password": password,
                "returnSecureToken": True
            }
            response = requests.post(FIREBASE_SIGNUP_URL, json=payload)
            
            if response.status_code == 200:
                QMessageBox.information(self, "Success", "Account created successfully!")
                self.accept()
            else:
                error_msg = response.json().get('error', {}).get('message', 'Registration Failed')
                QMessageBox.critical(self, "Registration Failed", error_msg)
        except Exception as e:
            QMessageBox.critical(self, "Connection Error", f"Could not connect to server: {str(e)}")


class LoginWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Login - Chemical Equipment Visualizer")
        self.setFixedSize(350, 350)
        self.init_ui()
        self.token = None

    def init_ui(self):
        layout = QVBoxLayout()
        
        # Header
        header = QLabel("Welcome Back")
        header.setAlignment(Qt.AlignCenter)
        header.setFont(QFont("Arial", 14, QFont.Bold))
        layout.addWidget(header)

        # Email
        layout.addWidget(QLabel("Email:"))
        self.username_input = QLineEdit()
        layout.addWidget(self.username_input)
        
        # Password
        layout.addWidget(QLabel("Password:"))
        self.password_input = QLineEdit()
        self.password_input.setEchoMode(QLineEdit.Password)
        layout.addWidget(self.password_input)
        
        # Login Button
        self.login_btn = QPushButton("Sign In")
        self.login_btn.clicked.connect(self.handle_login)
        self.login_btn.setStyleSheet("background-color: #2563eb; color: white; padding: 8px; font-weight: bold; border-radius: 4px;")
        layout.addWidget(self.login_btn)

        # Google Login Button
        self.google_btn = QPushButton("Sign in with Google")
        self.google_btn.clicked.connect(self.handle_google_login)
        self.google_btn.setStyleSheet("""
            QPushButton {
                background-color: white; 
                color: #757575; 
                padding: 8px; 
                border: 1px solid #ddd; 
                border-radius: 4px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #f1f1f1;
            }
        """)
        if not GOOGLE_AUTH_AVAILABLE:
            self.google_btn.setEnabled(False)
            self.google_btn.setText("Google Login (Lib Missing)")
        layout.addWidget(self.google_btn)

        # Separator
        layout.addSpacing(10)

        # Register Link
        self.register_btn = QPushButton("Create Account")
        self.register_btn.clicked.connect(self.open_register)
        self.register_btn.setFlat(True)
        self.register_btn.setStyleSheet("color: #2563eb; text-decoration: underline;")
        layout.addWidget(self.register_btn)
        
        self.setLayout(layout)

    def open_register(self):
        dialog = RegisterDialog(self)
        dialog.exec_()

    def handle_login(self):
        email = self.username_input.text()
        password = self.password_input.text()
        
        if not email or not password:
            QMessageBox.warning(self, "Error", "Please enter both email and password")
            return

        try:
            # Firebase Sign In
            payload = {
                "email": email,
                "password": password,
                "returnSecureToken": True
            }
            response = requests.post(FIREBASE_SIGNIN_URL, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                self.token = data['idToken']
                self.close()
            else:
                error_msg = response.json().get('error', {}).get('message', 'Login Failed')
                QMessageBox.critical(self, "Login Failed", f"Error: {error_msg}")
        except Exception as e:
            QMessageBox.critical(self, "Connection Error", f"Could not connect to server: {str(e)}")

    def handle_google_login(self):
        if not GOOGLE_AUTH_AVAILABLE:
            QMessageBox.warning(self, "Error", "google-auth-oauthlib library is not installed.")
            return

        client_secret_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'client_secret.json')
        
        # If default file doesn't exist, ask user to select it
        if not os.path.exists(client_secret_file):
            QMessageBox.information(self, "Select Client Secret", 
                "client_secret.json not found.\n\n"
                "Please select the OAuth 2.0 Client Secret JSON file downloaded from Google Cloud Console.\n"
                "(Credentials -> Create Credentials -> OAuth client ID -> Desktop app)")
            
            file_name, _ = QFileDialog.getOpenFileName(self, "Select OAuth Client Secret File", "", "JSON Files (*.json);;All Files (*)")
            if file_name:
                client_secret_file = file_name
            else:
                return # User cancelled

        try:
            # 1. Start OAuth 2.0 Flow to get Google ID Token
            flow = InstalledAppFlow.from_client_secrets_file(
                client_secret_file,
                scopes=['openid', 'email', 'profile']
            )
            
            # Use a fixed port (8080) to avoid random port mismatch issues
            # If this is a Web Client ID, you MUST add http://localhost:8080/ to Authorized Redirect URIs
            try:
                creds = flow.run_local_server(port=8080)
            except OSError:
                # Fallback to random port if 8080 is busy
                creds = flow.run_local_server(port=0)
            
            # 2. Exchange Google ID Token for Firebase Token
            if creds and creds.id_token:
                payload = {
                    "postBody": f"id_token={creds.id_token}&providerId=google.com",
                    "requestUri": "http://localhost",
                    "returnSecureToken": True
                }
                
                response = requests.post(FIREBASE_IDP_URL, json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    self.token = data['idToken']
                    self.close()
                else:
                    error_msg = response.json().get('error', {}).get('message', 'Google Auth Failed')
                    QMessageBox.critical(self, "Login Failed", f"Firebase Auth Error: {error_msg}")
            else:
                QMessageBox.warning(self, "Error", "Failed to retrieve Google credentials.")

        except Exception as e:
            QMessageBox.critical(self, "Google Login Error", f"An error occurred: {str(e)}")


class MainWindow(QMainWindow):
    def __init__(self, token):
        super().__init__()
        self.token = token
        # Create Auth header for Backend API
        self.headers = {"Authorization": f"Bearer {token}"}
        
        self.setWindowTitle("Chemical Equipment Parameter Visualizer")
        self.resize(1200, 800)
        self.init_ui()
        self.fetch_data()

    def init_ui(self):
        # Main Layout
        main_widget = QWidget()
        self.setCentralWidget(main_widget)
        main_layout = QVBoxLayout(main_widget)

        # Header / Toolbar
        toolbar_layout = QHBoxLayout()
        self.upload_btn = QPushButton("Upload CSV File")
        self.upload_btn.clicked.connect(self.upload_file)
        self.upload_btn.setStyleSheet("background-color: #10b981; color: white; padding: 8px; font-weight: bold;")
        self.refresh_btn = QPushButton("Refresh Data")
        self.refresh_btn.clicked.connect(self.fetch_data)
        
        toolbar_layout.addWidget(self.upload_btn)
        toolbar_layout.addWidget(self.refresh_btn)
        
        self.download_btn = QPushButton("Download PDF")
        self.download_btn.clicked.connect(self.download_pdf)
        self.download_btn.setStyleSheet("background-color: #3b82f6; color: white; padding: 8px; font-weight: bold;")
        toolbar_layout.addWidget(self.download_btn)
        
        toolbar_layout.addStretch()
        
        main_layout.addLayout(toolbar_layout)

        # Content Area
        self.tabs = QTabWidget()
        main_layout.addWidget(self.tabs)

        # Tab 1: Dashboard (Summary + Charts)
        self.dashboard_tab = QWidget()
        self.init_dashboard_tab()
        self.tabs.addTab(self.dashboard_tab, "Dashboard")

        # Tab 2: Data Table
        self.table_tab = QWidget()
        self.init_table_tab()
        self.tabs.addTab(self.table_tab, "Data Table")

    def init_dashboard_tab(self):
        layout = QVBoxLayout(self.dashboard_tab)
        
        # Summary Cards
        cards_layout = QHBoxLayout()
        self.card_total = self.create_card("Total Equipment")
        self.card_flow = self.create_card("Avg Flowrate")
        self.card_press = self.create_card("Avg Pressure")
        self.card_temp = self.create_card("Avg Temperature")
        
        cards_layout.addWidget(self.card_total)
        cards_layout.addWidget(self.card_flow)
        cards_layout.addWidget(self.card_press)
        cards_layout.addWidget(self.card_temp)
        
        layout.addLayout(cards_layout)

        # Charts Area
        charts_layout = QHBoxLayout()
        
        # Pie Chart
        self.pie_figure = Figure(figsize=(5, 4), dpi=100)
        self.pie_canvas = FigureCanvas(self.pie_figure)
        charts_layout.addWidget(self.pie_canvas)
        
        # Bar Chart
        self.bar_figure = Figure(figsize=(5, 4), dpi=100)
        self.bar_canvas = FigureCanvas(self.bar_figure)
        charts_layout.addWidget(self.bar_canvas)
        
        layout.addLayout(charts_layout)

    def create_card(self, title):
        group = QGroupBox(title)
        layout = QVBoxLayout()
        label = QLabel("Loading...")
        label.setAlignment(Qt.AlignCenter)
        label.setFont(QFont("Arial", 16, QFont.Bold))
        layout.addWidget(label)
        group.setLayout(layout)
        return group

    def update_card(self, group_box, value):
        label = group_box.layout().itemAt(0).widget()
        label.setText(str(value))

    def init_table_tab(self):
        layout = QVBoxLayout(self.table_tab)
        self.table = QTableWidget()
        self.table.setColumnCount(2)
        self.table.setHorizontalHeaderLabels(["Equipment Type", "Count"])
        header = self.table.horizontalHeader()
        header.setSectionResizeMode(QHeaderView.Stretch)
        layout.addWidget(self.table)

    def upload_file(self):
        options = QFileDialog.Options()
        file_name, _ = QFileDialog.getOpenFileName(self, "Open CSV File", "", "CSV Files (*.csv);;All Files (*)", options=options)
        if file_name:
            try:
                with open(file_name, 'rb') as f:
                    files = {'file': (file_name, f, 'text/csv')}
                    response = requests.post(f"{API_BASE_URL}upload/", files=files, headers=self.headers)
                
                if response.status_code == 201:
                    QMessageBox.information(self, "Success", "File uploaded successfully")
                    self.fetch_data()
                else:
                    QMessageBox.warning(self, "Error", f"Upload failed: {response.text}")
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Could not upload file: {str(e)}")

    def download_pdf(self):
        options = QFileDialog.Options()
        file_path, _ = QFileDialog.getSaveFileName(self, "Save PDF Report", "chemical_equipment_report.pdf", "PDF Files (*.pdf);;All Files (*)", options=options)
        
        if file_path:
            try:
                response = requests.post(f"{API_BASE_URL}generate-pdf/", headers=self.headers)
                
                if response.status_code == 200:
                    with open(file_path, 'wb') as f:
                        f.write(response.content)
                    QMessageBox.information(self, "Success", "PDF Report downloaded successfully")
                else:
                    QMessageBox.warning(self, "Error", f"Failed to generate PDF: {response.status_code}")
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Could not download PDF: {str(e)}")

    def fetch_data(self):
        try:
            response = requests.get(f"{API_BASE_URL}summary/", headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                self.update_ui(data)
            elif response.status_code == 404:
                # No data available
                pass
            else:
                print(f"Failed to fetch data: {response.status_code}")
        except Exception as e:
            print(f"Error fetching data: {e}")

    def update_ui(self, data):
        # Update Cards
        self.update_card(self.card_total, data['total_count'])
        self.update_card(self.card_flow, f"{data['avg_flowrate']:.2f}")
        self.update_card(self.card_press, f"{data['avg_pressure']:.2f}")
        self.update_card(self.card_temp, f"{data['avg_temperature']:.2f}")

        # Update Charts
        self.update_charts(data)

        # Update Table
        self.update_table(data['type_distribution'])

    def update_charts(self, data):
        # Pie Chart
        self.pie_figure.clear()
        ax1 = self.pie_figure.add_subplot(111)
        
        types = [d['equipment_type'] for d in data['type_distribution']]
        counts = [d['count'] for d in data['type_distribution']]
        
        ax1.pie(counts, labels=types, autopct='%1.1f%%', startangle=90)
        ax1.set_title("Equipment Type Distribution")
        self.pie_canvas.draw()

        # Bar Chart
        self.bar_figure.clear()
        ax2 = self.bar_figure.add_subplot(111)
        
        params = ['Avg Flow', 'Avg Press', 'Avg Temp']
        values = [data['avg_flowrate'], data['avg_pressure'], data['avg_temperature']]
        
        ax2.bar(params, values, color=['#3b82f6', '#eab308', '#ef4444'])
        ax2.set_title("Global Parameter Averages")
        self.bar_canvas.draw()

    def update_table(self, distribution):
        self.table.setRowCount(len(distribution))
        for i, row in enumerate(distribution):
            self.table.setItem(i, 0, QTableWidgetItem(row['equipment_type']))
            self.table.setItem(i, 1, QTableWidgetItem(str(row['count'])))

if __name__ == '__main__':
    app = QApplication(sys.argv)
    
    # Apply Fusion style for better look
    app.setStyle('Fusion')
    
    login = LoginWindow()
    login.show()
    
    # Block until login window closes
    app.exec_()
    
    if login.token:
        window = MainWindow(login.token)
        window.show()
        sys.exit(app.exec_())
