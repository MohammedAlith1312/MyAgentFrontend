"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Send as SendIcon, PenSquare, RefreshCw, Mail, Paperclip, X } from "lucide-react";
import Swal from 'sweetalert2';

import { Button } from "../components/UI/Button";
import { Input } from "../components/UI/Input";
import { Textarea } from "../components/UI/TextArea";
import { apiClient } from "../lib/api";
import type { Email } from "../lib/types";

export default function EmailPage() {
  const [activeTab, setActiveTab] = useState<"sent" | "compose">("sent");
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loadingList, setLoadingList] = useState(false);

  // Compose State
  const [form, setForm] = useState({ to: "", subject: "", body: "" });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Fetch
  useEffect(() => {
    if (activeTab === "sent") {
      fetchEmails();
    }
  }, [activeTab]);

  const fetchEmails = async () => {
    setLoadingList(true);
    try {
      const data = await apiClient.getEmails("sent");
      setEmails(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      // Process attachments
      const preparedAttachments = await Promise.all(attachments.map(async (file) => ({
        filename: file.name,
        content: await convertFileToBase64(file),
        type: file.type
      })));

      await apiClient.sendEmail({
        to: form.to,
        subject: form.subject,
        body: form.body,
        attachments: preparedAttachments.length > 0 ? preparedAttachments : undefined
      });

      Swal.fire({
        toast: true,
        icon: 'success',
        title: 'Email Sent',
        position: 'bottom-end',
        background: '#323232',
        color: '#fff',
        showConfirmButton: false,
        timer: 3000
      });
      setForm({ to: "", subject: "", body: "" });
      setAttachments([]);
      setActiveTab("sent"); // Switch to sent view
      fetchEmails();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Failed to send', text: err.message });
    } finally {
      setSending(false);
    }
  };

  const renderEmailList = () => {
    if (loadingList) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
          <p>Syncing sent emails...</p>
        </div>
      );
    }

    if (emails.length === 0) {
      return (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100 mx-4">
          <SendIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-gray-900 font-medium">No sent emails found</h3>
          <p className="text-gray-500 text-sm">Your sent box is empty</p>
        </div>
      );
    }

    return (
      <div className="space-y-2 px-2">
        {emails.map((email) => (
          <div
            key={email.id}
            onClick={() => setSelectedEmail(email)}
            className="bg-white p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                {email.subject || "(No Subject)"}
              </h4>
              <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                {email.date ? new Date(email.date).toLocaleDateString() : ""}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span className="font-medium mr-2 truncate flex-1">
                To: {email.to}
              </span>
            </div>
            <p className="text-gray-400 text-xs mt-2 line-clamp-2">
              {email.snippet}
            </p>
          </div>
        ))}
      </div>
    );
  };

  const renderDetailView = () => {
    if (!selectedEmail) return null;
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex justify-between items-start mb-6">
          <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)} className="mb-2 -ml-2 text-gray-500 hover:text-gray-900">
            ← Back to Sent
          </Button>
          <span className="text-sm text-gray-400">
            {selectedEmail.date ? new Date(selectedEmail.date).toLocaleString() : ""}
          </span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedEmail.subject || "(No Subject)"}</h2>

        <div className="flex flex-col gap-1 text-sm text-gray-600 mb-8 border-b border-gray-100 pb-6">
          <div className="flex gap-2">
            <span className="font-medium text-gray-900 w-12">To:</span>
            <span>{selectedEmail.to}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-gray-900 w-12">From:</span>
            <span>{selectedEmail.from || "Me"}</span>
          </div>
        </div>

        {/* Attachments Display */}
        {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-3">
            {selectedEmail.attachments.map((file, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg max-w-sm hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <Paperclip className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.filename}</p>
                  <p className="text-xs text-gray-500">{file.type || 'File'}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
          {selectedEmail.body}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <SendIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sent Mail</h1>
            <p className="text-xs text-gray-500 font-medium">Synced with Gmail</p>
          </div>
        </div>
        {activeTab !== "compose" && !selectedEmail && (
          <Button
            onClick={() => setActiveTab("compose")}
            className="bg-blue-600 text-white shadow-lg shadow-blue-200"
          >
            <PenSquare className="w-4 h-4 mr-2" />
            Compose
          </Button>
        )}
      </header>

      {/* Toolbar (Refresh only, no tabs) - Hide if detail or compose */}
      {activeTab === "sent" && !selectedEmail && (
        <div className="bg-white border-b border-gray-200 px-6 flex items-center justify-between py-2">
          <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">Sent Items</p>
          <button
            onClick={fetchEmails}
            className="flex items-center gap-2 text-gray-400 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loadingList ? "animate-spin" : ""}`} />
            <span className="text-sm font-medium">Sync</span>
          </button>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">

          {activeTab === "compose" ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">New Message</h2>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("sent")}>Close</Button>
              </div>
              <form onSubmit={handleSend} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <Input
                    required
                    value={form.to}
                    onChange={e => setForm({ ...form, to: e.target.value })}
                    placeholder="recipient@example.com"
                    className="bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <Input
                    required
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    placeholder="Subject"
                    className="bg-gray-50 border-gray-200 focus:bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <Textarea
                    required
                    value={form.body}
                    onChange={e => setForm({ ...form, body: e.target.value })}
                    rows={10}
                    placeholder="Write your email..."
                    className="bg-gray-50 border-gray-200 focus:bg-white resize-y min-h-[200px]"
                  />
                </div>

                {/* Attachments List */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg text-sm group">
                        <Paperclip className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-gray-700 truncate max-w-[200px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(i)}
                          className="text-gray-400 hover:text-red-500 ml-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                  />

                  <Button type="submit" disabled={sending} className="bg-blue-600 hover:bg-blue-700 text-white flex-1 h-12 text-base shadow-lg shadow-blue-200">
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><SendIcon className="w-4 h-4 mr-2" /> Send Email</>}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-200"
                    title="Attach files"
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Button type="button" variant="ghost" className="px-6" onClick={() => setActiveTab("sent")}>
                    Discard
                  </Button>
                </div>
              </form>
            </div>
          ) : selectedEmail ? (
            renderDetailView()
          ) : (
            <div className="animate-in fade-in duration-300">
              {renderEmailList()}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}