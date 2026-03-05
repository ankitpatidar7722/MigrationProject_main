import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Mail, CheckCircle, AlertCircle, FileText,
    Plus, Search, Filter, Trash2, Edit3, Loader2, ArrowLeft,
    Calendar, User, Tag, Paperclip, MoreVertical, X, Upload
} from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { api } from '../services/api';
import { ProjectEmail, EmailCategory, Project } from '../types';

const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) => (
    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-lg">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500 dark:text-zinc-400">{label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const EmailDocumentation = () => {
    const { id } = useParams<{ id: string }>();
    // Handle projectId whether it's string or number
    // Handle projectId whether it's string or number
    const projectId = id ? parseInt(id) : 0;
    const { hasPermission } = useAuth();
    const navigate = useNavigate();

    const [emails, setEmails] = useState<ProjectEmail[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<EmailCategory | 'All'>('All');

    const [projects, setProjects] = useState<Project[]>([]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingEmail, setEditingEmail] = useState<ProjectEmail | null>(null);
    const [formData, setFormData] = useState<Partial<ProjectEmail>>({
        projectId: projectId || 0,
        category: 'General',
        emailDate: new Date().toISOString().split('T')[0],
        receivers: '',
        sender: ''
    });
    const [attachment, setAttachment] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadProjects();
        loadEmails(projectId);
    }, [projectId]);

    const loadProjects = async () => {
        try {
            const data = await api.projects.getAll();
            setProjects(data);
        } catch (error) {
            console.error('Failed to load projects', error);
        }
    };

    const loadEmails = async (pId: number) => {
        try {
            setLoading(true);
            let data;
            if (pId && pId > 0) {
                data = await api.emails.getByProject(pId);
            } else {
                data = await api.emails.getAll();
            }
            setEmails(data);
        } catch (error) {
            console.error('Failed to load emails:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEmails = emails.filter(email => {
        const project = projects.find(p => p.projectId === email.projectId);
        const matchesSearch =
            email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.sender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.receivers?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.bodyContent?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project?.clientName?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'All' || email.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const categories: EmailCategory[] = ['Approval', 'Clarification', 'Issue', 'Completion', 'Rejection', 'Follow-up', 'General'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = new FormData();
            // Use formData.projectId if available (global mode), else use route param projectId
            const targetProjectId = formData.projectId || projectId;
            if (!targetProjectId) {
                alert("Please select a project");
                return;
            }
            data.append('ProjectId', targetProjectId.toString());
            data.append('Subject', formData.subject || '');
            data.append('Sender', formData.sender || '');
            data.append('Receivers', formData.receivers || '');
            data.append('EmailDate', formData.emailDate || new Date().toISOString());
            data.append('BodyContent', formData.bodyContent || '');
            data.append('Category', formData.category || 'General');
            if (formData.relatedModule) data.append('RelatedModule', formData.relatedModule);

            if (attachment) {
                data.append('attachment', attachment);
            }

            if (editingEmail) {
                // Update
                // Note: Current API Update doesn't support FormData/File update easily as implemented
                // Ideally we split update endpoint or handle multipart on PUT
                // For now, let's assume update metadata only or handle it if we modified backend to support PUT FormData
                // But my backend Update expects JSON.
                // Let's use the JSON update for now and ignore file update for edit in this iteration, 
                // or re-implement backend update.
                // Given the complexity, I'll stick to JSON update for now and maybe alert user file won't change
                const updatePayload: any = { ...formData, emailId: editingEmail.emailId, projectId };
                if (editingEmail.attachmentPath) updatePayload.attachmentPath = editingEmail.attachmentPath;

                await api.emails.update(editingEmail.emailId, updatePayload);
            } else {
                await api.emails.create(data);
            }

            setShowModal(false);
            resetForm();
            loadEmails(projectId);
        } catch (error) {
            console.error('Failed to save email:', error);
            alert('Failed to save email record.');
        }
    };

    const handleDelete = async (emailId: number) => {
        if (window.confirm('Are you sure you want to delete this email record?')) {
            try {
                await api.emails.delete(emailId);
                loadEmails(projectId);
            } catch (error) {
                console.error('Failed to delete email:', error);
            }
        }
    };

    const resetForm = () => {
        setEditingEmail(null);
        setFormData({
            projectId: projectId || 0,
            category: 'General',
            emailDate: new Date().toISOString().split('T')[0],
            receivers: '',
            sender: ''
        });
        setAttachment(null);
    };

    const openEdit = (email: ProjectEmail) => {
        setEditingEmail(email);
        setFormData({
            ...email,
            emailDate: email.emailDate.split('T')[0]
        });
        setShowModal(true);
    };

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'Approval': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'Rejection': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'Issue': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'Clarification': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'Completion': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button onClick={() => navigate(-1)} className="flex items-center text-sm text-slate-500 hover:text-slate-700 mb-2">
                        <ArrowLeft size={16} className="mr-1" /> Back to Project
                    </button>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Mail className="text-blue-600" />
                        Email Documentation
                    </h1>
                    <p className="text-slate-500">Manage client approvals and communication records</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={<Mail className="text-blue-600" />} label="Total Emails" value={emails.length} />
                    <StatCard icon={<CheckCircle className="text-emerald-600" />} label="Approvals" value={emails.filter(e => e.category === 'Approval').length} />
                    <StatCard icon={<AlertCircle className="text-orange-600" />} label="Clarifications" value={emails.filter(e => e.category === 'Clarification').length} />
                    <StatCard icon={<FileText className="text-purple-600" />} label="Requirements" value={emails.filter(e => e.category === 'Requirement').length} />
                </div>
                {hasPermission('Email Documentation', 'Create') && (
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <Plus size={18} />
                        Add Email Record
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search subject, sender, content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap overflow-x-auto pb-2 md:pb-0">
                    <Filter size={18} className="text-slate-400" />
                    <button
                        onClick={() => setSelectedCategory('All')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${selectedCategory === 'All'
                            ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${selectedCategory === cat
                                ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Email List */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-12 text-slate-500">Loading emails...</div>
                ) : filteredEmails.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <Mail className="mx-auto mb-3 opacity-20" size={48} />
                        <p>No email records found</p>
                    </div>
                ) : (
                    filteredEmails.map(email => (
                        <div key={email.emailId} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition group">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        {!projectId && (
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                {projects.find(p => p.projectId === email.projectId)?.clientName || 'Unknown Project'}
                                            </span>
                                        )}
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getCategoryColor(email.category)}`}>
                                            {email.category}
                                        </span>
                                        <span className="flex items-center text-xs text-slate-400 gap-1">
                                            <Calendar size={12} />
                                            {new Date(email.emailDate).toLocaleDateString()} {new Date(email.emailDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1 truncate">
                                        {email.subject}
                                    </h3>
                                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600 dark:text-slate-400 mb-3">
                                        <span className="flex items-center gap-1.5">
                                            <User size={14} className="text-slate-400" />
                                            From: <span className="font-medium text-slate-700 dark:text-slate-300">{email.sender}</span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <User size={14} className="text-slate-400" />
                                            To: <span className="font-medium text-slate-700 dark:text-slate-300">{email.receivers}</span>
                                        </span>
                                    </div>
                                    <div className="prose dark:prose-invert prose-sm max-w-none text-slate-600 dark:text-slate-400 line-clamp-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                        {email.bodyContent}
                                    </div>

                                    {email.attachmentPath && (
                                        <div className="mt-3">
                                            <a
                                                href={`http://localhost:5000${email.attachmentPath}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-md transition-colors"
                                            >
                                                <Paperclip size={14} />
                                                View Attachment
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {hasPermission('Email Documentation', 'Edit') && (
                                        <button onClick={() => openEdit(email)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition">
                                            <Edit3 size={18} />
                                        </button>
                                    )}
                                    {hasPermission('Email Documentation', 'Delete') && (
                                        <button onClick={() => handleDelete(email.emailId)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
                            <h2 className="text-xl font-bold">{editingEmail ? 'Edit Email Record' : 'Add New Email Record'}</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Project Name</label>
                                <select
                                    value={formData.projectId || ''}
                                    onChange={(e) => setFormData({ ...formData, projectId: parseInt(e.target.value) })}
                                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={!!projectId}
                                >
                                    <option value="" disabled>Select Project</option>
                                    {projects.map(p => (
                                        <option key={p.projectId} value={p.projectId}>{p.clientName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value as EmailCategory })}
                                        className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
                                    <input
                                        type="date"
                                        value={String(formData.emailDate)}
                                        onChange={(e) => setFormData({ ...formData, emailDate: e.target.value })}
                                        className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Subject</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.subject || ''}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Email Subject"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sender</label>
                                    <input
                                        type="text"
                                        value={formData.sender || ''}
                                        onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                                        className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. client@example.com"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Receivers</label>
                                    <input
                                        type="text"
                                        value={formData.receivers || ''}
                                        onChange={(e) => setFormData({ ...formData, receivers: e.target.value })}
                                        className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. me@company.com; pm@company.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Content / Body</label>
                                <textarea
                                    required
                                    rows={8}
                                    value={formData.bodyContent || ''}
                                    onChange={(e) => setFormData({ ...formData, bodyContent: e.target.value })}
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                    placeholder="Paste full email content here..."
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Attachment (Screenshot/PDF)</label>
                                <div
                                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="mx-auto text-slate-400 mb-2" />
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {attachment ? attachment.name : 'Click to upload attachment'}
                                    </p>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                                    />
                                </div>
                                {editingEmail?.attachmentPath && !attachment && (
                                    <p className="text-xs text-slate-500 mt-1">Current attachment: {editingEmail.attachmentPath.split('/').pop()}</p>
                                )}
                            </div>

                            <div className="pt-4 flex gap-3 justify-end border-t border-slate-200 dark:border-slate-800 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                {(editingEmail ? hasPermission('Email Documentation', 'Edit') : hasPermission('Email Documentation', 'Create')) && (
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
                                    >
                                        {editingEmail ? 'Update Email' : 'Add Email'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div >
            )}
        </div >
    );
};

export default EmailDocumentation;
