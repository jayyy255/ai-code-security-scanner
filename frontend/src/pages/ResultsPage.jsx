import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  ShieldAlert, 
  ArrowLeft, 
  Copy, 
  Check, 
  Eye, 
  ListFilter,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  AlertTriangle
} from 'lucide-react';
import { getAnalysisResult } from '../services/api';
import './ResultsPage.css';

export default function ResultsPage() {
  const { analysisId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [result, setResult] = useState(null);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [activeTab, setActiveTab] = useState('overview'); // overview, remediation, code
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadResult() {
      // 1. Check if passed in router state
      if (location.state && location.state.data) {
        const data = location.state.data;
        setResult(data);
        if (data.findings && data.findings.length > 0) {
          setSelectedFinding(data.findings[0]);
        }
      } else {
        // 2. Fetch from history vault directly (e.g. on page refresh)
        try {
          const data = await getAnalysisResult(analysisId);
          if (data) {
            setResult(data);
            if (data.findings && data.findings.length > 0) {
              setSelectedFinding(data.findings[0]);
            }
          } else {
            // Redirect to analyze page if report not found
            navigate('/analyze');
          }
        } catch (err) {
          console.error("Error loading scan result:", err);
          navigate('/analyze');
        }
      }
    }
    loadResult();
  }, [analysisId, location.state, navigate]);

  if (!result) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <p>Loading analysis report...</p>
      </div>
    );
  }

  const { summary, findings } = result;
  const score = Math.round(summary.security_score);

  // SVG circular properties
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // Filtered findings list
  const filteredFindings = findings.filter(finding => {
    if (filterSeverity === 'ALL') return true;
    return finding.severity.toUpperCase() === filterSeverity.toUpperCase();
  });

  // Recharts formatted data
  const chartData = [
    { name: 'Critical', value: summary.critical, color: '#ef4444' },
    { name: 'High', value: summary.high, color: '#f97316' },
    { name: 'Medium', value: summary.medium, color: '#eab308' },
    { name: 'Low', value: summary.low, color: '#3b82f6' }
  ].filter(item => item.value > 0);

  // Copy code to clipboard handler
  const handleCopyCode = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Color picker for score
  const getScoreColorClass = (val) => {
    if (val >= 90) return 'text-safe';
    if (val >= 70) return 'text-warning';
    return 'text-critical';
  };

  const getScoreStrokeColor = (val) => {
    if (val >= 90) return '#22c55e';
    if (val >= 70) return '#eab308';
    return '#ef4444';
  };

  return (
    <div className="container results-container animate-fade-in">
      <div className="results-back-link" onClick={() => navigate('/analyze')}>
        <ArrowLeft size={16} />
        <span>Back to workspace</span>
      </div>

      <div className="results-header-info">
        <div>
          <h1>Security Scan Report</h1>
          <div className="results-meta">
            <span>ID: <code className="meta-value">{analysisId.substring(0, 8)}...</code></span>
            <span>Language: <span className="meta-value">{result.language || 'python'}</span></span>
            <span>Date: <span className="meta-value">{new Date(result.timestamp || Date.now()).toLocaleDateString()}</span></span>
          </div>
        </div>
      </div>

      {/* Overview Dashboard */}
      <div className="dashboard-summary-grid">
        {/* Score Radial Indicator */}
        <div className="card score-card">
          <span className="score-label">Security Health</span>
          <div className="score-circle-wrapper">
            <svg className="score-svg">
              <circle className="score-bg-circle" cx="70" cy="70" r={radius} />
              <circle 
                className="score-fill-circle" 
                cx="70" 
                cy="70" 
                r={radius} 
                stroke={getScoreStrokeColor(score)}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="score-value-text">
              <span>{score}</span>
              <span className="score-total">/100</span>
            </div>
          </div>
          <span className="score-desc">
            {score >= 90 ? 'Excellent! Code conforms to secure coding practices.' : 
             score >= 70 ? 'Warning: Medium and high issues require attention.' : 
             'Critical: Urgent security fixes are required.'}
          </span>
        </div>

        {/* Severity Metrics Counts */}
        <div className="stats-cards-grid">
          <div className="card stat-box critical">
            <span className="stat-label">Critical</span>
            <span className="stat-value" style={{ color: 'var(--severity-critical)' }}>{summary.critical}</span>
          </div>
          <div className="card stat-box high">
            <span className="stat-label">High</span>
            <span className="stat-value" style={{ color: 'var(--severity-high)' }}>{summary.high}</span>
          </div>
          <div className="card stat-box medium">
            <span className="stat-label">Medium</span>
            <span className="stat-value" style={{ color: 'var(--severity-medium)' }}>{summary.medium}</span>
          </div>
          <div className="card stat-box low">
            <span className="stat-label">Low</span>
            <span className="stat-value" style={{ color: 'var(--severity-low)' }}>{summary.low}</span>
          </div>
        </div>

        {/* Recharts Pie Chart */}
        <div className="card chart-box">
          <span className="chart-header">Severity Ratio</span>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={45}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: '#12131c', 
                    borderColor: '#262837', 
                    borderRadius: '6px',
                    color: '#fff',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0' }}>
              <ShieldCheck size={32} style={{ color: 'var(--status-safe)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Clean scan</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace: Findings List vs Detail Inspector */}
      {findings.length > 0 ? (
        <div className="findings-workspace animate-fade-in">
          {/* Left panel: list of findings */}
          <div className="findings-panel">
            <div className="findings-filter-bar">
              <span className="flex items-center gap-4" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <ListFilter size={14} /> Filter Severity:
              </span>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`filter-chip ${filterSeverity === sev ? 'active' : ''}`}
                >
                  {sev}
                </button>
              ))}
            </div>

            <div className="findings-list">
              {filteredFindings.map((finding, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    setSelectedFinding(finding);
                    setActiveTab('overview');
                  }}
                  className={`finding-item-row ${selectedFinding === finding ? 'selected' : ''}`}
                >
                  <span className={`badge badge-${finding.severity.toLowerCase()}`}>
                    {finding.severity}
                  </span>
                  
                  {finding.line && (
                    <span className="finding-line-badge">
                      Line {finding.line}
                    </span>
                  )}
                  
                  <div className="finding-info">
                    <div className="finding-info-title">{finding.message}</div>
                    <div className="finding-info-meta">
                      <span>Scanner: <span className="meta-value">{finding.scanner}</span></span>
                      <span>Rule: <code style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{finding.rule_id}</code></span>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredFindings.length === 0 && (
                <div className="card" style={{ padding: '40px', textAlignment: 'center', color: 'var(--text-muted)' }}>
                  No findings matching search filter.
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Active finding detail inspector */}
          {selectedFinding ? (
            <div className="inspector-panel animate-fade-in">
              <div className="inspector-header">
                <div className="inspector-severity-row">
                  <span className={`badge badge-${selectedFinding.severity.toLowerCase()}`}>
                    {selectedFinding.severity}
                  </span>
                  <span className="finding-line-badge">
                    Line {selectedFinding.line || 'Unknown'}
                  </span>
                </div>
                <h2 className="inspector-title">{selectedFinding.message}</h2>
              </div>

              {/* Tabs */}
              <div className="inspector-tabs">
                <button 
                  onClick={() => setActiveTab('overview')} 
                  className={`inspector-tab ${activeTab === 'overview' ? 'active' : ''}`}
                >
                  Overview & Risk
                </button>
                <button 
                  onClick={() => setActiveTab('remediation')} 
                  className={`inspector-tab ${activeTab === 'remediation' ? 'active' : ''}`}
                >
                  Remediation
                </button>
                <button 
                  onClick={() => setActiveTab('code')} 
                  className={`inspector-tab ${activeTab === 'code' ? 'active' : ''}`}
                >
                  Secure Fix
                </button>
              </div>

              {/* Tab Contents */}
              <div className="inspector-content">
                {activeTab === 'overview' && (
                  <div className="animate-fade-in">
                    {/* Metadata tags */}
                    <div className="metadata-tags-section">
                      {selectedFinding.vulnerability_class && selectedFinding.vulnerability_class.map((c, i) => (
                        <span key={i} className="meta-tag">{c}</span>
                      ))}
                      {selectedFinding.cwe && selectedFinding.cwe.map((cwe, i) => (
                        <span key={i} className="meta-tag">{cwe}</span>
                      ))}
                      {selectedFinding.owasp && selectedFinding.owasp.map((ow, i) => (
                        <span key={i} className="meta-tag">{ow}</span>
                      ))}
                    </div>

                    <div className="detail-section-title">Vulnerability Analysis</div>
                    <p className="detail-paragraph">{selectedFinding.explanation || 'No detailed explanation provided by the engine.'}</p>
                    
                    <div className="detail-section-title">Threat Impact</div>
                    <p className="detail-paragraph">{selectedFinding.risk || 'No risk evaluation available for this rule.'}</p>
                    
                    <div className="flex justify-between items-center" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                      <span>Scanner Engine: <span className="meta-value">{selectedFinding.scanner}</span></span>
                      <span>Likelihood: <span className="meta-value">{selectedFinding.likelihood || 'N/A'}</span></span>
                    </div>
                  </div>
                )}

                {activeTab === 'remediation' && (
                  <div className="animate-fade-in">
                    <div className="detail-section-title">How to Remediate</div>
                    {selectedFinding.remediation && selectedFinding.remediation.length > 0 ? (
                      <ul className="remediation-list">
                        {selectedFinding.remediation.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="detail-paragraph">No explicit remediation steps suggested. Review programming guidelines for secure coding practices.</p>
                    )}
                  </div>
                )}

                {activeTab === 'code' && (
                  <div className="animate-fade-in">
                    <div className="detail-section-title">AI Remediation Fix</div>
                    <div className="code-diff-wrapper">
                      {selectedFinding.fixed_code ? (
                        <div className="code-box">
                          <div className="code-box-header safe">
                            <div className="flex items-center gap-4">
                              <CheckCircle2 size={12} />
                              <span>SECURE RECOMMENDATION</span>
                            </div>
                            <button 
                              onClick={() => handleCopyCode(selectedFinding.fixed_code)}
                              className="code-copy-btn"
                              title="Copy code"
                            >
                              {copied ? <Check size={14} style={{ color: 'var(--status-safe)' }} /> : <Copy size={14} />}
                            </button>
                          </div>
                          <pre className="code-container-pre">
                            <code>{selectedFinding.fixed_code}</code>
                          </pre>
                        </div>
                      ) : (
                        <p className="detail-paragraph">No secure code snippet fix suggested for this finding.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '40px', textAlignment: 'center' }}>
              Select a vulnerability from the left panel to inspect details.
            </div>
          )}
        </div>
      ) : (
        <div className="no-findings-box animate-fade-in">
          <ShieldCheck size={52} style={{ color: 'var(--status-safe)' }} />
          <h2 className="no-findings-title">Codebase Safe!</h2>
          <p className="no-findings-desc">
            Awesome! The static analysis and secret detectors found 0 security flaws in this submission.
          </p>
        </div>
      )}
    </div>
  );
}
