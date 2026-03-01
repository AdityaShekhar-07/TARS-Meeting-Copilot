import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface Task {
  description: string;
  assignee: string;
  deadline: string;
}

function Dashboard() {
  const [transcript, setTranscript] = useState('');
  const [title, setTitle] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]); // Make sure the [] is there!
  const [mode, setMode] = useState('Comprehensive');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userName, setUserName] = useState('');
  const [telemetry, setTelemetry] = useState({ 
    tokens: 0, 
    duration: 0, 
    model: '', 
    engine: 'Local GPU (Ollama)' 
});

  const myName = auth.currentUser?.email?.split('@')[0].toLowerCase() || 'employee';

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.displayName) {
        setUserName(user.displayName);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const handleProcess = async () => {
    if (!transcript.trim()) {
        alert("Please paste a transcript first!");
        return;
    }

    setIsProcessing(true);
    setTasks([]);
    
    // 1. START THE CLOCK
    const startTime = performance.now();

    const systemPrompt = `You are a strict JSON generator. Extract action items. 
    Return ONLY a JSON object with a key named "actions" which is an array of objects. 
    Each object must have: "description", "assignee", "deadline".
    Transcript: ${transcript}`;

    try {
        const response = await fetch('http://127.0.0.1:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3',
                prompt: systemPrompt,
                format: 'json',
                stream: false
            })
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const data = await response.json();
        const parsedData = JSON.parse(data.response);

        // Parsing logic
        let finalTasks = Array.isArray(parsedData) ? parsedData : (parsedData.actions || []);
        setTasks(finalTasks);

        // Firebase Save
        try {
            await addDoc(collection(db, "meetings"), {
                userId: auth.currentUser?.uid || "anonymous",
                userName: myName,
                modeUsed: mode,
                tasks: finalTasks,
                createdAt: serverTimestamp()
            });
        } catch (dbError) {
            console.error("Firebase Error: ", dbError);
        }

        // 2. STOP THE CLOCK
        const endTime = performance.now();
        const totalDuration = ((endTime - startTime) / 1000).toFixed(2);

        // 3. Update Telemetry
        setTelemetry({
            tokens: data.eval_count || 0,
            duration: parseFloat(totalDuration), // Now shows total time from click to finish
            model: data.model || 'llama3',
            engine: 'Local GPU (Ollama)'
        });

    } catch (error) {
        console.error("Full Error details:", error);
        alert("Connection failed! Check the Console (F12).");
    } finally {
        setIsProcessing(false);
    }
};

const clearForm = () => {
    setTranscript('');
    setTasks([]);
};

  const myTasks = tasks.filter(task => task.assignee.toLowerCase() === myName);

  return (
    <div style={{ backgroundColor: '#0a0a0a', color: '#ffffff', minHeight: '100vh', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER SECTION */}
      <header style={{ borderBottom: '1px solid #333', paddingBottom: '1.5rem', marginBottom: '2.5rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, background: 'linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '2.8rem', letterSpacing: '-1px' }}>TARS Meeting Copilot</h1>
          {userName && (
            <p style={{ color: '#00d2ff', margin: '8px 0 0 0', fontWeight: '500', fontSize: '1rem' }}>Welcome back, {userName}!</p>
          )}
        </div>
       <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Mode Selectors */}
          <div style={{ display: 'flex', gap: '5px', backgroundColor: '#151515', padding: '6px', borderRadius: '10px', border: '1px solid #2a2a2a' }}>
            {['Fast', 'Deep', 'Comprehensive'].map(m => {
              const getColor = () => {
                if (m === 'Fast') return '#10b981';
                if (m === 'Deep') return '#1e3a8a';
                return '#7c3aed';
              };
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  onMouseEnter={(e) => {
                    if (mode !== m) e.currentTarget.style.backgroundColor = '#222';
                  }}
                  onMouseLeave={(e) => {
                    if (mode !== m) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: mode === m ? getColor() : 'transparent',
                    color: mode === m ? 'white' : '#777',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: mode === m ? 'bold' : 'normal',
                    fontSize: '0.85rem'
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Sign Out Button */}
          <button onClick={handleSignOut} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#ff4444', border: '1px solid rgba(255, 68, 68, 0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', transition: '0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 68, 68, 0.1)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            Sign Out
          </button>
        </div>
      </header>

      {/* NPU Status Bar */}
      <div style={{ maxWidth: '1200px', margin: '0 auto -1rem auto', marginBottom: '2rem' }}>
        <span style={{ color: '#4caf50', fontSize: '0.85rem', fontWeight: '500' }}>● NPU Secure Local Processing Active</span>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* INPUT FORM SECTION */}
        <div style={{ backgroundColor: '#121212', padding: '2.5rem', borderRadius: '16px', border: '1px solid #222', boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#eee', fontWeight: '600' }}>Session Parameters</h2>
            <button 
              onClick={clearForm} 
              style={{ 
                backgroundColor: 'transparent', 
                color: '#ff4444', 
                border: '1px solid rgba(255, 68, 68, 0.3)', 
                padding: '6px 14px', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontSize: '0.85rem',
                transition: 'all 0.2s ease',
                transform: 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(255, 68, 68, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Clear Data
            </button>
          </div>
          
          <input type="text" placeholder="Meeting Title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '16px', marginBottom: '1rem', backgroundColor: '#080808', color: 'white', border: '1px solid #333', borderRadius: '8px', boxSizing: 'border-box' }} />
          
          <textarea placeholder="Paste transcript..." value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={8} style={{ width: '100%', padding: '16px', backgroundColor: '#080808', color: '#ddd', border: '1px solid #333', borderRadius: '8px', boxSizing: 'border-box', fontFamily: 'monospace' }} />
          
          <button onClick={handleProcess} disabled={isProcessing} style={{ marginTop: '2rem', padding: '16px 24px', background: 'linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%', fontSize: '1.1rem', fontWeight: 'bold' }}>
            {isProcessing ? `Processing ${mode} Mode...` : 'Generate Action Items'}
          </button>
        </div>

        {/* SPLIT-SCREEN TASK ROUTING */}
        {isProcessing && (
          <div style={{ backgroundColor: '#121212', padding: '3rem', borderRadius: '16px', border: '1px solid #222', textAlign: 'center' }}>
            <h2 style={{ color: '#00d2ff', fontSize: '1.5rem', margin: 0 }}>Generating Tasks....</h2>
          </div>
        )}
        {!isProcessing && tasks.length > 0 && (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {/* Left Column: My Assigned Tasks */}
            <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#121212', padding: '2rem', borderRadius: '16px', border: '1px solid #222' }}>
              <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.4rem', color: '#10b981' }}>My Assigned Tasks</h2>
              {myTasks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {myTasks.map((task, index) => (
                    <div key={index} style={{ backgroundColor: '#0a0a0a', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                      <p style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#fff' }}>{task.description}</p>
                      <span style={{ display: 'inline-block', padding: '4px 10px', backgroundColor: 'rgba(255, 165, 0, 0.2)', color: '#ffa500', borderRadius: '12px', fontSize: '0.8rem' }}>
                        ⏳ {task.deadline}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#777', fontSize: '0.95rem' }}>No tasks assigned to you.</p>
              )}
            </div>

            {/* Right Column: All Meeting Tasks */}
            <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#121212', padding: '2rem', borderRadius: '16px', border: '1px solid #222' }}>
              <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.4rem', color: '#00d2ff' }}>All Meeting Tasks</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {tasks.map((task, index) => (
                  <div key={index} style={{ backgroundColor: '#0a0a0a', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #00d2ff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <p style={{ margin: 0, fontSize: '1rem', color: '#fff', flex: 1 }}>{task.description}</p>
                      <span style={{ marginLeft: '0.5rem', padding: '4px 8px', backgroundColor: 'rgba(58, 123, 213, 0.2)', color: '#3a7bd5', borderRadius: '8px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        @{task.assignee}
                      </span>
                    </div>
                    <span style={{ display: 'inline-block', padding: '4px 10px', backgroundColor: 'rgba(255, 165, 0, 0.2)', color: '#ffa500', borderRadius: '12px', fontSize: '0.8rem' }}>
                      ⏳ {task.deadline}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* SYSTEM TELEMETRY BAR */}
<div style={{ 
    marginTop: '3rem', 
    padding: '1rem 2rem', 
    backgroundColor: '#0a0a0a', 
    borderTop: '1px solid #333', 
    display: 'flex', 
    justifyContent: 'space-around', 
    fontFamily: 'monospace',
    color: '#888',
    fontSize: '0.85rem'
}}>
    <span>ENGINE: <b style={{ color: '#fff' }}>{telemetry.engine}</b></span>
    <span>MODEL: <b style={{ color: '#fff' }}>{telemetry.model || 'N/A'}</b></span>
    <span>TOKENS: <b style={{ color: '#4caf50' }}>{telemetry.tokens}</b></span>
    <span>LATENCY: <b style={{ color: '#ff9800' }}>{telemetry.duration}s</b></span>
    <span>STATUS: <b style={{ color: '#00e5ff' }}>Private / Local</b></span>
</div>
    </div>
  );
}

export default Dashboard;