// API Service for AI Code Security Reviewer

const BACKEND_URL = '/api';

let isLoggedIn = false;

// Helper to determine if user is logged in (used locally in this service)
export function setLoggedInStatus(status) {
  isLoggedIn = status;
}

// Generate a random UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// --- AUTH SERVICES ---

export async function getCurrentUser() {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/me`, {
      credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      if (data.user) {
        isLoggedIn = true;
        return data.user;
      }
    }
    isLoggedIn = false;
    return null;
  } catch (error) {
    console.error("Error getting session user:", error);
    isLoggedIn = false;
    return null;
  }
}

export async function login(username, password) {
  const response = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error || 'Login failed');
  }

  const data = await response.json();
  isLoggedIn = true;
  return data.user;
}

export async function signup(username, email, password) {
  const response = await fetch(`${BACKEND_URL}/auth/signup`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error || 'Signup failed');
  }

  const data = await response.json();
  isLoggedIn = true;
  return data.user;
}

export async function logout() {
  const response = await fetch(`${BACKEND_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }

  isLoggedIn = false;
}

// Sync Local Guest History to MongoDB backend
export async function syncLocalHistoryToBackend() {
  if (!isLoggedIn) return;
  
  const localHistoryStr = localStorage.getItem('reviewer_scan_history');
  if (!localHistoryStr) return;

  try {
    const localHistory = JSON.parse(localHistoryStr);
    if (localHistory && localHistory.length > 0) {
      console.log(`Syncing ${localHistory.length} local scans to database...`);
      for (const item of localHistory) {
        await fetch(`${BACKEND_URL}/history`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      }
      localStorage.removeItem('reviewer_scan_history');
      console.log('Local history successfully synced and cleared.');
    }
  } catch (error) {
    console.error('Failed to sync guest history to backend:', error);
  }
}

// --- HISTORY SERVICES (SYNCED W/ BACKEND) ---

// Check if a scan result is stored in local storage
export async function getHistory() {
  if (isLoggedIn) {
    try {
      const response = await fetch(`${BACKEND_URL}/history`, {
        credentials: 'include'
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn("Failed to fetch history from database. Falling back to local storage.", error);
    }
  }
  const history = localStorage.getItem('reviewer_scan_history');
  return history ? JSON.parse(history) : [];
}

// Save scan result to history
export async function saveToHistory(scanResult) {
  // If logged in, the Express proxy backend already saves it automatically
  if (!isLoggedIn) {
    const history = await getHistory();
    if (!history.some(item => item.analysis_id === scanResult.analysis_id)) {
      const updated = [
        {
          analysis_id: scanResult.analysis_id,
          timestamp: new Date().toISOString(),
          score: scanResult.summary.security_score,
          language: scanResult.language || 'python',
          critical: scanResult.summary.critical,
          high: scanResult.summary.high,
          medium: scanResult.summary.medium,
          low: scanResult.summary.low,
          summary: scanResult.summary,
          findings: scanResult.findings,
          code: scanResult.code
        },
        ...history
      ];
      localStorage.setItem('reviewer_scan_history', JSON.stringify(updated));
    }
  }
}

// Delete from history
export async function deleteFromHistory(analysisId) {
  if (isLoggedIn) {
    try {
      const response = await fetch(`${BACKEND_URL}/history/${analysisId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) return;
    } catch (error) {
      console.error("Failed to delete record from database:", error);
    }
  }
  
  const history = await getHistory();
  const filtered = history.filter(item => item.analysis_id !== analysisId);
  localStorage.setItem('reviewer_scan_history', JSON.stringify(filtered));
}

// Clear all history
export async function clearHistory() {
  if (isLoggedIn) {
    try {
      const response = await fetch(`${BACKEND_URL}/history`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) return;
    } catch (error) {
      console.error("Failed to clear database vault:", error);
    }
  }
  localStorage.removeItem('reviewer_scan_history');
}

// Get finding by Analysis ID
export async function getAnalysisResult(analysisId) {
  const history = await getHistory();
  return history.find(item => item.analysis_id === analysisId) || null;
}

// Call API or fallback to mock
export async function analyzeCode(code, language) {
  try {
    const response = await fetch(`${BACKEND_URL}/analyze`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code, language })
    });

    if (response.ok) {
      const data = await response.json();
      const result = {
        ...data,
        language,
        code
      };
      await saveToHistory(result);
      return result;
    } else {
      throw new Error(`Server returned status: ${response.status}`);
    }
  } catch (error) {
    console.warn("Backend API is unreachable. Falling back to Demo Mode with mock results.", error);
    
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockResult = generateMockResponse(code, language);
    await saveToHistory(mockResult);
    return mockResult;
  }
}

// Detailed Mock Data Generator for Offline Demo Mode
function generateMockResponse(code, language) {
  const analysisId = generateUUID();
  const cleanLang = language.toLowerCase();
  
  let findings = [];
  let summary = {
    security_score: 100,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  if (cleanLang === 'python') {
    summary = { security_score: 35, critical: 2, high: 1, medium: 0, low: 0 };
    findings = [
      {
        scanner: 'gitleaks',
        rule_id: 'github-pat',
        line: 5,
        severity: 'CRITICAL',
        message: 'Hardcoded GitHub Personal Access Token was exposed in source code.',
        owasp: ['A07:2021-Identification and Authentication Failures'],
        cwe: ['CWE-798: Use of Hardcoded Credentials'],
        vulnerability_class: ['Hardcoded Secrets'],
        likelihood: 'HIGH',
        impact: 'HIGH',
        confidence: 'HIGH',
        explanation: 'A plain-text credentials pattern matching GitHub tokens was discovered directly in the source file. If pushed to a version control system, this key can be easily compromised.',
        risk: 'Attackers can scan repos, extract the secret, and gain access to your private GitHub organization, codebases, or APIs.',
        remediation: [
          'Revoke the leaked token immediately.',
          'Inject secrets dynamically at runtime from environment variables using `os.environ` or `.env` configuration files.',
          'Add `.env` to your `.gitignore` file to prevent committing secrets.'
        ],
        fixed_code: `import os\n\ntoken = os.getenv("GITHUB_TOKEN")`
      },
      {
        scanner: 'semgrep',
        rule_id: 'python.lang.security.audit.sqli.sqlite-execute',
        line: 11,
        severity: 'HIGH',
        message: 'Direct formatting of SQL queries using unsanitized user inputs enables SQL Injection.',
        owasp: ['A03:2021-Injection'],
        cwe: ['CWE-89: Improper Neutralization of Special Elements used in an SQL Command'],
        vulnerability_class: ['SQL Injection'],
        likelihood: 'HIGH',
        impact: 'HIGH',
        confidence: 'HIGH',
        explanation: 'Interpolating or formatting SQL strings (using `f"..."`) with parameters directly provided by users bypasses SQL parsing constraints, allowing SQL keywords injection.',
        risk: 'Attackers can execute queries, bypass authentication filters, delete tables, or read sensitive customer records.',
        remediation: [
          'Use parameterized SQL command structures or prepared statements where placeholders are parsed separately from variables.',
          'Avoid executing dynamic query commands on SQL databases using direct input strings.'
        ],
        fixed_code: `query = "SELECT * FROM users WHERE id = ?"\ncursor.execute(query, (user_id,))`
      },
      {
        scanner: 'semgrep',
        rule_id: 'python.lang.security.audit.system-run-injection',
        line: 15,
        severity: 'CRITICAL',
        message: 'Untrusted user input concatenated into a system shell executor (os.system) causes Remote Code Execution (RCE).',
        owasp: ['A03:2021-Injection'],
        cwe: ['CWE-78: Improper Neutralization of Special Elements used in an OS Command'],
        vulnerability_class: ['Command Injection'],
        likelihood: 'HIGH',
        impact: 'CRITICAL',
        confidence: 'HIGH',
        explanation: 'The function passes raw input directly to the system shell. If an attacker inputs command separator symbols (e.g. `; rm -rf /`), the secondary instruction will execute with system privileges.',
        risk: 'Complete control of server operating system, filesystem deletion, malware hosting, or data egress.',
        remediation: [
          'Use the `subprocess` library with `shell=False` to pass arguments in an array.',
          'Never execute inputs directly via system command line shells.'
        ],
        fixed_code: `import subprocess\n\nsubprocess.run(["ping", "-c", "1", user_id], shell=False, check=True)`
      }
    ];
  } else if (cleanLang === 'javascript' || cleanLang === 'typescript') {
    summary = { security_score: 45, critical: 1, high: 2, medium: 0, low: 0 };
    findings = [
      {
        scanner: 'gitleaks',
        rule_id: 'aws-access-key',
        line: 4,
        severity: 'CRITICAL',
        message: 'AWS Access Key ID exposed in clear text inside credentials configuration.',
        owasp: ['A07:2021-Identification and Authentication Failures'],
        cwe: ['CWE-798: Use of Hardcoded Credentials'],
        vulnerability_class: ['Hardcoded Secrets'],
        likelihood: 'HIGH',
        impact: 'HIGH',
        confidence: 'HIGH',
        explanation: 'AWS credentials blocks contain hardcoded tokens. Leaving private keys in static files invites unauthorized cloud access.',
        risk: 'Cloud account takeover, resource creation billing fraud, S3 bucket data dumps, database modifications.',
        remediation: [
          'Invalidate credentials keys in the AWS Management Console immediately.',
          'Load credentials securely from environment configuration properties or task roles (e.g., IAM roles on EC2/ECS).'
        ],
        fixed_code: `const s3 = new AWS.S3({\n  accessKeyId: process.env.AWS_ACCESS_KEY_ID,\n  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY\n});`
      },
      {
        scanner: 'semgrep',
        rule_id: 'javascript.express.security.audit.eval-injection',
        line: 14,
        severity: 'HIGH',
        message: 'Dynamic execution of inputs via eval() represents a dangerous code injection flaw.',
        owasp: ['A03:2021-Injection'],
        cwe: ['CWE-95: Improper Neutralization of Directives in Dynamically Evaluated Code'],
        vulnerability_class: ['Code Injection'],
        likelihood: 'MEDIUM',
        impact: 'HIGH',
        confidence: 'HIGH',
        explanation: 'Passing inputs to eval() executes strings as application code. Attackers can inject node instructions, spawning background jobs or printing process environment configurations.',
        risk: 'RCE, local file read, access to application environment properties.',
        remediation: [
          'Eliminate use of eval() completely. Replace with standard property indexing or JSON parsing if extracting configuration attributes.'
        ],
        fixed_code: `console.log('Running: ', command);`
      }
    ];
  } else if (cleanLang === 'java') {
    summary = { security_score: 50, critical: 1, high: 1, medium: 0, low: 0 };
    findings = [
      {
        scanner: 'gitleaks',
        rule_id: 'db-password',
        line: 63,
        severity: 'CRITICAL',
        message: 'Hardcoded database credentials exposed in static variable.',
        owasp: ['A07:2021-Identification and Authentication Failures'],
        cwe: ['CWE-798: Use of Hardcoded Credentials'],
        vulnerability_class: ['Hardcoded Secrets'],
        likelihood: 'HIGH',
        impact: 'HIGH',
        confidence: 'HIGH',
        explanation: 'The static field `DB_PASS` contains a hardcoded password. Committing database passwords to version control allows unauthorized access to database contents.',
        risk: 'Attackers can access production database tables, reading or corrupting business records.',
        remediation: [
          'Rotate the database password immediately.',
          'Load credentials dynamically using environment variables or a configuration manager.'
        ],
        fixed_code: `private static final String DB_PASS = System.getenv("DB_PASSWORD");`
      },
      {
        scanner: 'semgrep',
        rule_id: 'java.lang.security.audit.sqli',
        line: 69,
        severity: 'HIGH',
        message: 'Unsanitized string concatenation in SQL statement causing SQL Injection.',
        owasp: ['A03:2021-Injection'],
        cwe: ['CWE-89: SQL Injection'],
        vulnerability_class: ['SQL Injection'],
        likelihood: 'HIGH',
        impact: 'HIGH',
        confidence: 'HIGH',
        explanation: 'String concatenation dynamically inserts parameters directly into SQL instructions, allowing external user inputs to manipulate database queries.',
        risk: 'Attackers can bypass query logic to read all records, edit records, or drop tables.',
        remediation: [
          'Use parameterized SQL statements with prepared statements placeholders (?)'
        ],
        fixed_code: `String sql = "SELECT * FROM products WHERE category = ?";\nPreparedStatement stmt = conn.prepareStatement(sql);\nstmt.setString(1, input);\nResultSet rs = stmt.executeQuery();`
      }
    ];
  } else if (cleanLang === 'go') {
    summary = { security_score: 48, critical: 1, high: 1, medium: 0, low: 0 };
    findings = [
      {
        scanner: 'gitleaks',
        rule_id: 'slack-token',
        line: 84,
        severity: 'CRITICAL',
        message: 'Hardcoded Slack access token exposed in source code.',
        owasp: ['A07:2021-Identification and Authentication Failures'],
        cwe: ['CWE-798: Use of Hardcoded Credentials'],
        vulnerability_class: ['Hardcoded Secrets'],
        likelihood: 'HIGH',
        impact: 'HIGH',
        confidence: 'HIGH',
        explanation: 'Exposing Slack credentials in code makes bot channels and workspace contents accessible to outsiders.',
        risk: 'Attackers can post false messages, read messages, or steal user details in your Slack workspace.',
        remediation: [
          'Revoke the token in the Slack app console.',
          'Inject Slack tokens dynamically from the environment.'
        ],
        fixed_code: `slackToken := os.Getenv("SLACK_API_TOKEN")`
      },
      {
        scanner: 'semgrep',
        rule_id: 'go.lang.security.audit.cmd-injection',
        line: 89,
        severity: 'HIGH',
        message: 'Command execution with unsanitized user inputs enables OS Command Injection.',
        owasp: ['A03:2021-Injection'],
        cwe: ['CWE-78: Command Injection'],
        vulnerability_class: ['Command Injection'],
        likelihood: 'HIGH',
        impact: 'CRITICAL',
        confidence: 'HIGH',
        explanation: 'Running commands inside a shell wrapper (sh -c) using concatenated strings allows users to append command delimiters (like ; or &&) to run arbitrary terminal commands.',
        risk: 'Full takeover of host OS privileges and execution of arbitrary binaries.',
        remediation: [
          'Bypass the shell executor and run target executable directly with command arguments passed as an array.'
        ],
        fixed_code: `cmd := exec.Command("nslookup", target)`
      }
    ];
  } else if (cleanLang === 'cpp' || cleanLang === 'c') {
    summary = { security_score: 55, critical: 1, high: 1, medium: 0, low: 0 };
    findings = [
      {
        scanner: 'gitleaks',
        rule_id: 'api-key',
        line: 110,
        severity: 'CRITICAL',
        message: 'Hardcoded static API key exposed in source code.',
        owasp: ['A07:2021-Identification and Authentication Failures'],
        cwe: ['CWE-798: Use of Hardcoded Credentials'],
        vulnerability_class: ['Hardcoded Secrets'],
        likelihood: 'HIGH',
        impact: 'HIGH',
        confidence: 'HIGH',
        explanation: 'Declaring API keys as static strings makes them visible in the binary, easily extracted by reverse-engineering.',
        risk: 'Unauthorized use of API quota and billing costs.',
        remediation: [
          'Rotate the API key.',
          'Load keys dynamically from secure config files or variables.'
        ],
        fixed_code: `const char* apiKey = std::getenv("API_KEY");`
      },
      {
        scanner: 'semgrep',
        rule_id: 'cpp.lang.security.audit.strcpy-buffer-overflow',
        line: 115,
        severity: 'HIGH',
        message: 'Unbounded copy with strcpy() enables stack-based Buffer Overflow.',
        owasp: ['A09:2021-Security Logging and Monitoring Failures'],
        cwe: ['CWE-120: Buffer Copy without Checking Size of Input'],
        vulnerability_class: ['Buffer Overflow'],
        likelihood: 'HIGH',
        impact: 'HIGH',
        confidence: 'HIGH',
        explanation: 'strcpy does not restrict the bytes copied. If the source input size exceeds the 64-byte destination buffer, it overflows the stack memory, corrupting adjacent registers or return addresses.',
        risk: 'Stack corruption, program crashes, or remote arbitrary code execution.',
        remediation: [
          'Use boundary-checking alternatives like strncpy or std::string objects in C++.'
        ],
        fixed_code: `// Safe copy using boundary safety in C++\nstd::string safeBuffer = userInput;\nstd::cout << "Input received: " << safeBuffer << std::endl;`
      }
    ];
  } else if (cleanLang === 'csharp' || cleanLang === 'cs') {
    summary = { security_score: 52, critical: 1, high: 1, medium: 0, low: 0 };
    findings = [
      {
        scanner: 'gitleaks',
        rule_id: 'jwt-secret',
        line: 124,
        severity: 'CRITICAL',
        message: 'Hardcoded JWT signing key exposed in code definition.',
        owasp: ['A07:2021-Identification and Authentication Failures'],
        cwe: ['CWE-798: Use of Hardcoded Credentials'],
        vulnerability_class: ['Hardcoded Secrets'],
        likelihood: 'HIGH',
        impact: 'HIGH',
        confidence: 'HIGH',
        explanation: 'JWT secrets signed in clear text permit third parties to forge signed tokens, bypassing auth checks entirely.',
        risk: 'Bypass auth, privilege escalation to administrator roles.',
        remediation: [
          'Invalidate existing tokens.',
          'Retrieve the token key from a secure app settings config or cloud key vault.'
        ],
        fixed_code: `private static string JwtSecret => Environment.GetEnvironmentVariable("JWT_SIGNING_KEY");`
      },
      {
        scanner: 'semgrep',
        rule_id: 'csharp.lang.security.audit.cmd-injection',
        line: 127,
        severity: 'HIGH',
        message: 'Concatenated system shell args cause OS command injection.',
        owasp: ['A03:2021-Injection'],
        cwe: ['CWE-78: Command Injection'],
        vulnerability_class: ['Command Injection'],
        likelihood: 'HIGH',
        impact: 'HIGH',
        confidence: 'HIGH',
        explanation: 'Passing inputs to cmd.exe command arguments enables argument injection and OS execution hijacking.',
        risk: 'Arbitrary shell instructions run with application process credentials.',
        remediation: [
          'Strictly sanitize string arguments or pass them separately in ProcessStartInfo.ArgumentList (available in .NET Core).'
        ],
        fixed_code: `// Safe execution using ArgumentList\nProcessStartInfo startInfo = new ProcessStartInfo() {\n    FileName = "dir",\n    RedirectStandardOutput = true,\n    UseShellExecute = false\n};\nstartInfo.ArgumentList.Add(input);\nProcess process = Process.Start(startInfo);`
      }
    ];
  } else {
    summary = { security_score: 60, critical: 1, high: 1, medium: 0, low: 0 };
    findings = [
      {
        scanner: 'gitleaks',
        rule_id: 'hardcoded-key',
        line: 5,
        severity: 'CRITICAL',
        message: 'Hardcoded security secret or API credential token identified.',
        owasp: ['A07:2021-Identification and Authentication Failures'],
        cwe: ['CWE-798: Use of Hardcoded Credentials'],
        vulnerability_class: ['Hardcoded Secrets'],
        likelihood: 'HIGH',
        impact: 'HIGH',
        confidence: 'HIGH',
        explanation: 'Sensitive configurations or keys were found directly declared as code strings. Version control commits will index this permanently.',
        risk: 'Credentials leak, database access, integration endpoints spoofing.',
        remediation: [
          'Rotate tokens immediately.',
          'Migrate tokens to environment variables or settings files excluded from git.'
        ],
        fixed_code: `// Retrieve credentials from environment\nString secret = System.getenv("API_TOKEN");`
      },
      {
        scanner: 'semgrep',
        rule_id: 'injection-warning',
        line: 10,
        severity: 'HIGH',
        message: 'Improper sanitation of user inputs formatted into operating systems or database queries.',
        owasp: ['A03:2021-Injection'],
        cwe: ['CWE-89: SQL Injection'],
        vulnerability_class: ['Injection'],
        likelihood: 'HIGH',
        impact: 'HIGH',
        confidence: 'HIGH',
        explanation: 'Direct inputs are parsed into engine statements. Dynamic input parsing exposes sub-routine triggers to user controls.',
        risk: 'Privilege bypass, command injection, remote code execution, database breach.',
        remediation: [
          'Ensure string parsing structures decouple the system commands from the argument variables.',
          'Inject sanitization filters or parameter arrays.'
        ],
        fixed_code: `// Safe query parametrization\nPreparedStatement stmt = conn.prepareStatement(query);\nstmt.setString(1, input);`
      }
    ];
  }

  return {
    analysis_id: analysisId,
    language,
    code,
    summary,
    findings
  };
}
