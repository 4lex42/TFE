"use client";

import React from 'react';
import { ExcelImport } from '../../components/ExcelImport';

export default function ImportPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Import des Données
      </h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <ExcelImport />
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Instructions d'Import</h2>
        <div className="prose">
          <p>Pour importer vos données correctement, veuillez suivre ces étapes :</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Préparez votre fichier Excel avec les colonnes requises</li>
            <li>Assurez-vous que les données sont dans le bon format</li>
            <li>Utilisez le bouton d'import ci-dessus pour charger votre fichier</li>
            <li>Vérifiez les messages de confirmation ou d'erreur</li>
          </ol>
          <p className="mt-4">
            Les données importées seront automatiquement utilisées pour les prédictions
            de stock et les analyses de tendances.
          </p>
        </div>
      </div>
    </div>
  );
}
