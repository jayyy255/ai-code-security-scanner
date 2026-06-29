import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  Terminal, 
  Code, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { analyzeCode } from '../services/api';
import './AnalyzePage.css';

const LANGUAGES = [
  { id: 'python', name: 'Python' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'java', name: 'Java' },
  { id: 'go', name: 'Go' },
  { id: 'cpp', name: 'C++' },
  { id: 'csharp', name: 'C#' }
];

const PRESETS = {
  python: `import os
import sqlite3

# EXPOSED SECRET
token = "ghp_v4l5K0s9B3aJ9823M5lK283s71f02p"

def check_user(user_id):
    # SQL INJECTION
    db = sqlite3.connect("app.db")
    cursor = db.cursor()
    query = f"SELECT * FROM users WHERE id = '{user_id}'"
    cursor.execute(query)
    
    # COMMAND INJECTION
    os.system("ping -c 1 " + user_id)
`,
  javascript: `const AWS = require('aws-sdk');

// EXPOSED SECRET
const AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";
const AWS_SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

function runAction(command) {
  const s3 = new AWS.S3({
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY
  });
  
  // DANGEROUS EVAL
  eval("console.log('Running: ' + " + command + ")");
}
`,
  java: `import java.sql.*;

public class SecurityTest {
    // EXPOSED DATABASE PASSWORD
    private static final String DB_PASS = "admin_secret_123";

    public void processQuery(String input) throws SQLException {
        Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/test", "db_user", DB_PASS);
        
        // SQL INJECTION
        String sql = "SELECT * FROM products WHERE category = '" + input + "'";
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery(sql);
    }
}
`,
  go: `package main

import (
	"fmt"
	"net/http"
	"os/exec"
)

// EXPOSED ACCESS TOKEN
const slackToken = "xoxb-982372938472-928374928374-j82kf92k01"

func handler(w http.ResponseWriter, r *http.Request) {
	// COMMAND INJECTION VULNERABILITY
	target := r.URL.Query().Get("target")
	cmd := exec.Command("sh", "-c", "nslookup "+target)
	out, _ := cmd.CombinedOutput()
	fmt.Fprintf(w, "%s", out)
}
`,
  typescript: `import * as fs from 'fs';

// EXPOSED PRIVATE KEY
const privateKey = "-----BEGIN RSA PRIVATE KEY-----\\nMIIEowIBAAKCAQEA0y8g...\\n-----END RSA PRIVATE KEY-----";

export function readUserProfile(filename: string) {
  // PATH TRAVERSAL VULNERABILITY
  const path = "/var/data/users/" + filename;
  const data = fs.readFileSync(path, 'utf8');
  return JSON.parse(data);
}
`,
  cpp: `#include <iostream>
#include <cstring>

// EXPOSED API KEY
const char* apiKey = "api_key_ab39841f39c09d8e178a";

void copyInput(char* userInput) {
    char buffer[64];
    // BUFFER OVERFLOW VULNERABILITY
    std::strcpy(buffer, userInput);
    std::cout << "Input received: " << buffer << std::endl;
}
`,
  csharp: `using System;
using System.Diagnostics;

class VulnerableApp {
    // EXPOSED JWT SECRET
    private const string JwtSecret = "super_secret_jwt_sign_key_983719873";

    public void ExecuteCommand(string input) {
        // COMMAND INJECTION
        ProcessStartInfo startInfo = new ProcessStartInfo() {
            FileName = "cmd.exe",
            Arguments = "/c dir " + input,
            RedirectStandardOutput = true,
            UseShellExecute = false
        };
        Process process = Process.Start(startInfo);
        Console.WriteLine(process.StandardOutput.ReadToEnd());
    }
}
`
};

export default function AnalyzePage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(PRESETS.python);
  const [loading, setLoading] = useState(false);
  const [scanStep, setScanStep] = useState(1);

  // Sync preset when language changes
  useEffect(() => {
    if (PRESETS[language]) {
      setCode(PRESETS[language]);
    }
  }, [language]);

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  const selectPreset = (lang) => {
    setLanguage(lang);
    setCode(PRESETS[lang]);
  };

  const handleAnalyze = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setScanStep(1);

    // Step animation interval (for UI visual delight)
    const stepInterval = setInterval(() => {
      setScanStep((prev) => {
        if (prev < 3) return prev + 1;
        return prev;
      });
    }, 1500);

    try {
      // Make real API scan call
      const response = await analyzeCode(code, language);
      
      clearInterval(stepInterval);
      setScanStep(3);
      
      // Simulate small wrap-up delay for smooth visual transition
      setTimeout(() => {
        setLoading(false);
        // Navigate to results page
        navigate(`/results/${response.analysis_id}`, { state: { data: response } });
      }, 800);

    } catch (error) {
      console.error("Scan failed", error);
      clearInterval(stepInterval);
      setLoading(false);
      alert("Analysis failed. Please make sure the backend is active or try again.");
    }
  };

  return (
    <div className="container analyze-container animate-fade-in">
      <div className="analyze-header-section">
        <div className="analyze-title-group">
          <h1>Security Analysis Workspace</h1>
          <p>Paste your code or use presets below to audit security vulnerabilities.</p>
        </div>
        
        <div className="analyze-controls">
          <div className="lang-selector-wrapper">
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="select-input"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={handleAnalyze} 
            disabled={loading || !code.trim()}
            className="btn btn-primary"
          >
            <Play size={16} fill="white" />
            Analyze Code
          </button>
        </div>
      </div>

      {/* Editor Panel Card */}
      <div className="workspace-card">
        <div className="scan-line-sweep" style={{ display: loading ? 'block' : 'none' }}></div>
        
        <div className="workspace-bar">
          <div className="flex items-center gap-4">
            <Code size={14} className="purple-text" />
            <span className="editor-status">editor_sandbox.{language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language === 'go' ? 'go' : language === 'java' ? 'java' : language === 'cpp' ? 'cpp' : language === 'csharp' ? 'cs' : 'py'}</span>
          </div>
          <div className="editor-status">
            Line count: {code.split('\n').length}
          </div>
        </div>

        <div className="editor-wrapper">
          <Editor
            height="500px"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'Fira Code', ui-monospace, monospace",
              wordWrap: 'on',
              lineHeight: 22,
              padding: { top: 12, bottom: 12 },
              automaticLayout: true,
            }}
          />
        </div>

        {/* Dynamic Scan Loading Overlay */}
        {loading && (
          <div className="scan-overlay">
            <div className="scan-loader-box">
              <div className="scanner-ring-container">
                <div className="scanner-ring"></div>
                <div className="scanner-pulse">
                  <ShieldAlert size={26} />
                </div>
              </div>
              
              <h3 style={{ marginBottom: '24px' }}>Running Security Audits</h3>
              
              <div className="scan-steps">
                <div className={`scan-step ${scanStep >= 1 ? (scanStep === 1 ? 'active' : 'completed') : ''}`}>
                  <span className="step-indicator">
                    {scanStep > 1 ? <CheckCircle size={12} /> : 1}
                  </span>
                  <span>Scanning rules with Semgrep...</span>
                  {scanStep === 1 && <span className="scan-step-spinner"></span>}
                </div>
                
                <div className={`scan-step ${scanStep >= 2 ? (scanStep === 2 ? 'active' : 'completed') : ''}`}>
                  <span className="step-indicator">
                    {scanStep > 2 ? <CheckCircle size={12} /> : 2}
                  </span>
                  <span>Detecting credentials with Gitleaks...</span>
                  {scanStep === 2 && <span className="scan-step-spinner"></span>}
                </div>
                
                <div className={`scan-step ${scanStep >= 3 ? (scanStep === 3 ? 'active' : 'completed') : ''}`}>
                  <span className="step-indicator">
                    {scanStep > 3 ? <CheckCircle size={12} /> : 3}
                  </span>
                  <span>Generating AI explanations with Gemini...</span>
                  {scanStep === 3 && <span className="scan-step-spinner"></span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preset select options */}
      <div className="presets-banner animate-fade-in">
        <span className="preset-title flex items-center gap-4">
          <HelpCircle size={14} /> Try demo code snippets:
        </span>
        {LANGUAGES.map((lang) => (
          <button 
            key={lang.id} 
            onClick={() => selectPreset(lang.id)}
            className="preset-chip"
          >
            {lang.name} Preset
          </button>
        ))}
      </div>
    </div>
  );
}
