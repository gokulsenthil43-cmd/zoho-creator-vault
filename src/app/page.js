"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Plus, 
  Copy, 
  Check, 
  Blocks, 
  Code,
  FolderOpen,
  Settings,
  X,
  Database,
  Edit2,
  Trash2,
  Camera,
  User,
  Pencil,
  GripVertical
} from "lucide-react";

export default function CreatorCodeVault() {
  const [snippets, setSnippets] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isClient, setIsClient] = useState(false);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState(null);

  // Form state
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newCategory, setNewCategory] = useState("Deluge");
  const [newSteps, setNewSteps] = useState([{ id: Date.now().toString(), title: "", code: "" }]);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);

  const [copiedId, setCopiedId] = useState(null);
  
  // Edit state
  const [editingId, setEditingId] = useState(null);
  
  // Profile state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState("Creator Dev");
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("creator-snippets");
    if (saved) {
      setSnippets(JSON.parse(saved));
    } else {
      // Default sample snippet
      const sample = [
        {
          id: "1",
          title: "Fetch Record By Email",
          category: "Deluge",
          date: new Date().toLocaleDateString(),
          code: `// Fetch User Record based on Email\nuser_record = Form_Name[Email == input.Email];\nif(user_record.count() > 0) {\n    info "User Found: " + user_record.Name;\n} else {\n    info "User Not Found";\n}`
        }
      ];
      setSnippets(sample);
      localStorage.setItem("creator-snippets", JSON.stringify(sample));
    }
    
    const savedName = localStorage.getItem("creator-profile-name");
    const savedImage = localStorage.getItem("creator-profile-image");
    if (savedName) setProfileName(savedName);
    if (savedImage) setProfileImage(savedImage);
  }, []);

  const saveSnippets = (newSnippets) => {
    setSnippets(newSnippets);
    localStorage.setItem("creator-snippets", JSON.stringify(newSnippets));
  };

  const syncToDatabase = async (snippet, action) => {
    try {
      let fullCodeFlow = '';
      if (snippet.steps && snippet.steps.length > 0) {
        fullCodeFlow = snippet.steps.map((s, i) => `Step ${i + 1}: ${s.title || ''}\n${s.code}`).join('\n\n');
      } else {
        fullCodeFlow = snippet.code || '';
      }

      await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: snippet.id,
          title: snippet.title,
          subtitle: snippet.subtitle,
          category: snippet.category,
          codeFlow: fullCodeFlow,
          action: action,
          timestamp: new Date().toLocaleString()
        })
      });
    } catch (error) {
      console.error("Failed to sync to database", error);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedItemIndex(index);
    // Needed for Firefox drag and drop to work
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    const items = [...newSteps];
    const draggedItem = items[draggedItemIndex];
    items.splice(draggedItemIndex, 1);
    items.splice(index, 0, draggedItem);
    setNewSteps(items);
    setDraggedItemIndex(null);
  };

  const handleAddSnippet = () => {
    if (!newTitle.trim()) return;

    if (editingId) {
      const updatedSnippets = snippets.map(s => 
        s.id === editingId 
          ? { ...s, title: newTitle, subtitle: newSubtitle, category: newCategory, steps: newSteps }
          : s
      );
      saveSnippets(updatedSnippets);
      syncToDatabase({ id: editingId, title: newTitle, subtitle: newSubtitle, category: newCategory, steps: newSteps }, "Updated");
    } else {
      const snippet = {
        id: Date.now().toString(),
        title: newTitle,
        subtitle: newSubtitle,
        category: newCategory,
        date: new Date().toLocaleDateString(),
        steps: newSteps
      };
      saveSnippets([snippet, ...snippets]);
      syncToDatabase(snippet, "Saved");
    }

    setIsAddModalOpen(false);
    setNewTitle("");
    setNewSubtitle("");
    setNewSteps([{ id: Date.now().toString(), title: "", code: "" }]);
    setEditingId(null);
  };


  const openEditModal = (snippet) => {
    setNewTitle(snippet.title);
    setNewSubtitle(snippet.subtitle || "");
    setNewCategory(snippet.category);
    if (snippet.steps) {
      setNewSteps(snippet.steps);
    } else {
      setNewSteps([{ id: Date.now().toString(), title: "", code: snippet.code || "" }]);
    }
    setEditingId(snippet.id);
    setIsAddModalOpen(true);
  };

  const deleteSnippet = (id, e) => {
    if (e) e.stopPropagation();
    if(confirm("Are you sure you want to delete this snippet?")) {
      const snippetToDelete = snippets.find(s => s.id === id);
      const updatedSnippets = snippets.filter(s => s.id !== id);
      saveSnippets(updatedSnippets);
      if (snippetToDelete) {
        syncToDatabase(snippetToDelete, "Deleted");
      }
    }
  };
  
  const handleProfileSave = () => {
    localStorage.setItem("creator-profile-name", profileName);
    if (profileImage) localStorage.setItem("creator-profile-image", profileImage);
    setIsProfileModalOpen(false);
  };
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfileImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const copyToClipboard = (e, code, id) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSnippets = snippets.filter(s => {
    const titleMatch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
    const subtitleMatch = s.subtitle?.toLowerCase().includes(searchQuery.toLowerCase());
    const codeMatch = s.steps 
      ? s.steps.some(step => step.code.toLowerCase().includes(searchQuery.toLowerCase()) || step.title.toLowerCase().includes(searchQuery.toLowerCase()))
      : s.code?.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || subtitleMatch || codeMatch;
  });

  if (!isClient) return null; // Avoid hydration mismatch

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <Blocks className="brand-icon" size={28} />
          Creator Vault
        </div>

        <div className="nav-item active">
          <Code size={20} />
          All Snippets
        </div>
        
        <div style={{ marginTop: 'auto' }}>
          <div className="user-profile-block" onClick={() => setIsProfileModalOpen(true)}>
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="user-avatar" />
            ) : (
              <div className="user-avatar"><User size={20} /></div>
            )}
            <div className="user-info">
              <span className="user-name">{profileName}</span>
              <span className="user-role">Zoho Creator Eng</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <h1 className="header-title">My Snippets</h1>
          
          <div className="header-actions">
            <div className="search-box">
              <Search className="search-icon" />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search snippets, functions..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn-primary" onClick={() => {
              setNewTitle("");
              setNewSubtitle("");
              setNewSteps([{ id: Date.now().toString(), title: "", code: "" }]);
              setEditingId(null);
              setIsAddModalOpen(true);
            }}>
              <Plus size={20} />
              Add Snippet
            </button>
          </div>
        </header>

        {filteredSnippets.length === 0 ? (
          <div className="empty-state">
            <Database className="empty-icon" />
            <h2 className="empty-title">No snippets found</h2>
            <p>You haven&apos;t added any code that matches your search yet.</p>
          </div>
        ) : (
          <div className="snippet-grid">
            {filteredSnippets.map((snippet) => (
              <div 
                key={snippet.id} 
                className="snippet-card"
                onClick={() => setSelectedSnippet(snippet)}
              >
                <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <h3 className="card-title">{snippet.title}</h3>
                    <span className="card-badge">{snippet.category}</span>
                  </div>
                  {snippet.subtitle && (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {snippet.subtitle}
                    </div>
                  )}
                </div>
                <div className="card-preview" style={{ position: 'relative' }}>
                  {snippet.steps && snippet.steps.length > 0 ? snippet.steps[0].code : snippet.code}
                  {snippet.steps && snippet.steps.length > 1 && (
                    <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'var(--accent-primary)', color: 'white', fontSize: 10, padding: '2px 6px', borderRadius: 100, fontWeight: 'bold' }}>
                      +{snippet.steps.length - 1} steps
                    </div>
                  )}
                </div>
                <div className="card-footer">
                  <span>{snippet.date}</span>
                  <div className="card-actions">
                    <button 
                      className="action-btn-small" 
                      onClick={(e) => { e.stopPropagation(); openEditModal(snippet); }}
                      title="Edit Snippet"
                    >
                      <Pencil size={15} />
                    </button>
                    <button 
                      className="action-btn-small delete" 
                      onClick={(e) => deleteSnippet(snippet.id, e)}
                      title="Delete Snippet"
                    >
                      <Trash2 size={15} />
                    </button>
                    <button 
                      className="copy-btn-small" 
                      onClick={(e) => {
                        const allCode = snippet.steps 
                          ? snippet.steps.map((s, i) => `// ${s.title || 'Step ' + (i+1)}\n${s.code}`).join('\n\n') 
                          : snippet.code;
                        copyToClipboard(e, allCode, snippet.id);
                      }}
                      title="Copy All Code"
                    >
                      {copiedId === snippet.id ? <Check size={16} color="#4ade80" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* View Snippet Modal */}
      {selectedSnippet && (
        <div className="modal-overlay" onClick={() => setSelectedSnippet(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{selectedSnippet.title}</h2>
                {selectedSnippet.subtitle && (
                  <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '14px' }}>{selectedSnippet.subtitle}</p>
                )}
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="card-badge">{selectedSnippet.category}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Added on {selectedSnippet.date}</span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedSnippet(null)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              {selectedSnippet.steps ? (
                <div className="snippet-steps">
                  {selectedSnippet.steps.map((step, index) => (
                    <div key={step.id} className="step-container">
                      <div className="step-title">
                        <span style={{ color: 'var(--accent-primary)' }}>{index + 1}.</span> {step.title || `Step ${index + 1}`}
                      </div>
                      <div className="code-container">
                        <div className="code-header">
                          <span className="code-lang">{selectedSnippet.category}</span>
                          <button 
                            className="btn-primary" 
                            style={{ padding: '8px 16px', fontSize: '13px' }}
                            onClick={() => copyToClipboard(null, step.code, step.id)}
                          >
                            {copiedId === step.id ? (
                              <><Check size={16} /> Copied!</>
                            ) : (
                              <><Copy size={16} /> Copy Range</>
                            )}
                          </button>
                        </div>
                        <pre className="code-content">
                          <code>{step.code}</code>
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="code-container">
                  <div className="code-header">
                    <span className="code-lang">{selectedSnippet.category}</span>
                    <button 
                      className="btn-primary" 
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                      onClick={() => copyToClipboard(null, selectedSnippet.code, selectedSnippet.id)}
                    >
                      {copiedId === selectedSnippet.id ? (
                        <><Check size={16} /> Copied!</>
                      ) : (
                        <><Copy size={16} /> Copy Code</>
                      )}
                    </button>
                  </div>
                  <pre className="code-content">
                    <code>{selectedSnippet.code}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Snippet Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? "Edit Snippet" : "Add New Snippet"}</h2>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Snippet Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Fetch Record By Email"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subtitle / Description (Optional)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Daywise code for electricity"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Category</label>
                <select 
                  className="form-control"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  <option value="Deluge">Deluge</option>
                  <option value="JavaScript">JavaScript</option>
                  <option value="HTML">HTML</option>
                  <option value="CSS">CSS</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="steps-editor">
                <label className="form-label">Flow / Steps Code (Drag to Reorder)</label>
                {newSteps.map((step, index) => (
                  <div 
                    key={step.id} 
                    className={`step-edit-card ${draggedItemIndex === index ? 'dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    style={{ opacity: draggedItemIndex === index ? 0.5 : 1, transition: 'opacity 0.2s', borderLeft: '3px solid var(--accent-primary)' }}
                  >
                    <div className="step-edit-header">
                      <div style={{ display: 'flex', alignItems: 'center', width: '70%', gap: '12px' }}>
                        <div style={{ cursor: 'grab', display: 'flex' }} title="Drag to reorder">
                          <GripVertical size={18} color="var(--text-secondary)" />
                        </div>
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                          Step {index + 1}:
                        </span>
                        <input 
                          type="text" 
                          className="step-title-input" 
                          style={{ width: '100%' }}
                          placeholder="Description (optional)"
                          value={step.title}
                          onChange={(e) => {
                            const updated = [...newSteps];
                            updated[index].title = e.target.value;
                            setNewSteps(updated);
                          }}
                        />
                      </div>
                      {newSteps.length > 1 && (
                        <button 
                          className="action-btn-small delete"
                          onClick={() => {
                            setNewSteps(newSteps.filter(s => s.id !== step.id));
                          }}
                          title="Remove Step"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <textarea 
                      className="form-control" 
                      style={{ minHeight: '150px' }}
                      placeholder="Paste code for this step..."
                      value={step.code}
                      onChange={(e) => {
                        const updated = [...newSteps];
                        updated[index].code = e.target.value;
                        setNewSteps(updated);
                      }}
                    />
                  </div>
                ))}
                <button 
                  className="btn-secondary" 
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                  onClick={() => {
                    setNewSteps([...newSteps, { id: Date.now().toString(), title: "", code: "" }]);
                  }}
                >
                  <Plus size={18} /> Add Next Step
                </button>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleAddSnippet}>
                <Plus size={18} />
                Save Snippet
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Your Profile</h2>
              <button className="modal-close" onClick={() => setIsProfileModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="profile-upload-container">
                <div className="profile-upload-preview" onClick={() => fileInputRef.current?.click()}>
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" />
                  ) : (
                    <User size={40} color="var(--text-secondary)" />
                  )}
                  <div className="upload-overlay">
                    <Camera size={24} />
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Click to upload photo</span>
              </div>
              
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsProfileModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleProfileSave}>
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
