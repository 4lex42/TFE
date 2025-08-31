"use client";

import React, { useMemo, useState } from 'react';
import { useFournisseurs } from '../hooks/useFournisseurs';

export const FournisseursManagement: React.FC = () => {
  const { fournisseurs, loading, error, addFournisseur, deleteFournisseur, updateFournisseur } = useFournisseurs();
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', note: '' });
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nom: '', email: '', telephone: '', note: '' });
  
  // État pour la pagination des fournisseurs
  const [currentPage, setCurrentPage] = useState(1);
  const [fournisseursPerPage, setFournisseursPerPage] = useState(10);

  const filtered = useMemo(() => {
    const t = search.toLowerCase().trim();
    if (!t) return fournisseurs;
    return fournisseurs.filter(f =>
      f.nom.toLowerCase().includes(t) ||
      (f.email || '').toLowerCase().includes(t) ||
      (f.telephone || '').toLowerCase().includes(t)
    );
  }, [fournisseurs, search]);

  // Fonctions de pagination
  const totalPages = Math.ceil(filtered.length / fournisseursPerPage);
  const indexOfLastFournisseur = currentPage * fournisseursPerPage;
  const indexOfFirstFournisseur = indexOfLastFournisseur - fournisseursPerPage;
  const currentFournisseurs = filtered.slice(indexOfFirstFournisseur, indexOfLastFournisseur);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll vers le haut de la liste
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFournisseursPerPageChange = (newFournisseursPerPage: number) => {
    setFournisseursPerPage(newFournisseursPerPage);
    setCurrentPage(1); // Retour à la première page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Réinitialiser la pagination quand le nombre de fournisseurs change
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filtered.length, currentPage, totalPages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim()) {
      setMessage({ type: 'error', text: 'Le nom est requis.' });
      return;
    }
    const res = await addFournisseur({ nom: form.nom.trim(), email: form.email || null, telephone: form.telephone || null, note: form.note || null });
    if (res.success) {
      setMessage({ type: 'success', text: 'Fournisseur ajouté.' });
      setForm({ nom: '', email: '', telephone: '', note: '' });
    } else {
      setMessage({ type: 'error', text: res.error || 'Erreur lors de l\'ajout.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce fournisseur ?')) return;
    const res = await deleteFournisseur(id);
    if (!res.success) setMessage({ type: 'error', text: res.error || 'Erreur lors de la suppression.' });
  };

  const handleEdit = (fournisseur: any) => {
    setEditingId(fournisseur.id);
    setEditForm({
      nom: fournisseur.nom,
      email: fournisseur.email || '',
      telephone: fournisseur.telephone || '',
      note: fournisseur.note || ''
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editForm.nom.trim()) {
      setMessage({ type: 'error', text: 'Le nom est requis.' });
      return;
    }
    
    const res = await updateFournisseur(editingId, {
      nom: editForm.nom.trim(),
      email: editForm.email || null,
      telephone: editForm.telephone || null,
      note: editForm.note || null
    });
    
    if (res.success) {
      setMessage({ type: 'success', text: 'Fournisseur modifié avec succès.' });
      setEditingId(null);
      setEditForm({ nom: '', email: '', telephone: '', note: '' });
    } else {
      setMessage({ type: 'error', text: res.error || 'Erreur lors de la modification.' });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ nom: '', email: '', telephone: '', note: '' });
  };

  return (
    <div>
      {message && (
        <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right">×</button>
        </div>
      )}

      {/* Formulaire d'ajout */}
      <div className="bg-white border rounded p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Ajouter un fournisseur</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm mb-1">Nom *</label>
            <input value={form.nom} onChange={(e)=>setForm({...form, nom: e.target.value})} className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm mb-1">Téléphone</label>
            <input value={form.telephone} onChange={(e)=>setForm({...form, telephone: e.target.value})} className="w-full border p-2 rounded" />
          </div>
          <div className="md:col-span-4">
            <label className="block text-sm mb-1">Note</label>
            <input value={form.note} onChange={(e)=>setForm({...form, note: e.target.value})} className="w-full border p-2 rounded" />
          </div>
          <div>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Ajouter</button>
          </div>
        </form>
      </div>

      {/* Recherche */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Rechercher par nom, email ou téléphone..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          {search && (
            <button onClick={()=>setSearch('')} className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white border rounded">
        <div className="px-4 py-3 border-b bg-gray-50 rounded-t">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Fournisseurs</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Afficher par page:</label>
                <select
                  value={fournisseursPerPage}
                  onChange={(e) => handleFournisseursPerPageChange(Number(e.target.value))}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="text-sm text-gray-600">
                Affichage {indexOfFirstFournisseur + 1}-{Math.min(indexOfLastFournisseur, filtered.length)} sur {filtered.length} fournisseurs
              </div>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-3 text-sm font-medium text-gray-700">
            <div className="col-span-2">Nom</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Téléphone</div>
            <div className="col-span-3">Note</div>
            <div className="col-span-2">Actions</div>
          </div>
        </div>
        {loading ? (
          <div className="p-4 text-sm text-gray-500">Chargement...</div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">Erreur: {error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Aucun fournisseur trouvé</div>
        ) : (
          <div className="divide-y">
            {currentFournisseurs.map(f => (
              <div key={f.id} className="grid grid-cols-12 gap-3 px-4 py-2 items-center">
                {editingId === f.id ? (
                  // Mode édition
                  <form onSubmit={handleUpdate} className="col-span-12 grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-2">
                      <input
                        value={editForm.nom}
                        onChange={(e) => setEditForm({...editForm, nom: e.target.value})}
                        className="w-full border p-1 rounded text-sm"
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        className="w-full border p-1 rounded text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        value={editForm.telephone}
                        onChange={(e) => setEditForm({...editForm, telephone: e.target.value})}
                        className="w-full border p-1 rounded text-sm"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        value={editForm.note}
                        onChange={(e) => setEditForm({...editForm, note: e.target.value})}
                        className="w-full border p-1 rounded text-sm"
                        placeholder="Note optionnelle"
                      />
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <button
                        type="submit"
                        className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 transition-colors"
                        title="Sauvegarder"
                      >
                        Sauvegarder
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600 transition-colors"
                        title="Annuler"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                ) : (
                  // Mode affichage
                  <>
                    <div className="col-span-2 truncate" title={f.nom}>{f.nom}</div>
                    <div className="col-span-3 truncate" title={f.email || ''}>{f.email || '-'}</div>
                    <div className="col-span-2 truncate" title={f.telephone || ''}>{f.telephone || '-'}</div>
                    <div className="col-span-3 truncate" title={f.note || ''}>{f.note || '-'}</div>
                    <div className="col-span-2 flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(f)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                        title="Modifier"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition-colors"
                        title="Supprimer"
                      >
                        Supprimer
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Contrôles de pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} sur {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Précédent
                    </button>
                    
                    {/* Numéros de page */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, index) => {
                        const pageNumber = index + 1;
                        // Afficher seulement quelques pages autour de la page actuelle
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => handlePageChange(pageNumber)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                pageNumber === currentPage
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        } else if (
                          pageNumber === currentPage - 2 ||
                          pageNumber === currentPage + 2
                        ) {
                          return (
                            <span key={pageNumber} className="px-2 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
