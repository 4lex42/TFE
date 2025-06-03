import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

interface ExcelData {
  nom: string;
  quantity: number;
  quantity_critique: number;
  prix: number;
  code: string;
  description?: string;
  ventes: number;
  date: string;
}

export const ExcelImport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const processExcelData = async (data: ExcelData[]) => {
    try {
      for (const row of data) {
        // Vérifier si le produit existe déjà
        const { data: existingProduct } = await supabase
          .from('produit')
          .select('id')
          .eq('code', row.code)
          .single();

        if (existingProduct) {
          // Mettre à jour le produit existant
          await supabase
            .from('produit')
            .update({
              quantity: row.quantity,
              prix: row.prix,
              description: row.description
            })
            .eq('id', existingProduct.id);

          // Ajouter une nouvelle prédiction
          await supabase
            .from('predictions')
            .insert([{
              date: row.date,
              prod_prix: row.prix,
              ventes: row.ventes
            }]);
        } else {
          // Créer un nouveau produit
          const { data: newProduct } = await supabase
            .from('produit')
            .insert([{
              nom: row.nom,
              quantity: row.quantity,
              quantity_critique: row.quantity_critique,
              prix: row.prix,
              code: row.code,
              description: row.description
            }])
            .select()
            .single();

          if (newProduct) {
            // Ajouter une prédiction initiale
            await supabase
              .from('predictions')
              .insert([{
                date: row.date,
                prod_prix: row.prix,
                ventes: row.ventes
              }]);
          }
        }
      }
      setSuccess('Données importées avec succès !');
    } catch (err) {
      setError('Erreur lors de l\'importation des données');
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const binaryStr = event.target?.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelData[];

        // Valider les données
        const requiredFields = ['nom', 'quantity', 'quantity_critique', 'prix', 'code', 'ventes', 'date'];
        const isValid = jsonData.every(row => 
          requiredFields.every(field => field in row)
        );

        if (!isValid) {
          setError('Format de fichier invalide. Veuillez vérifier que toutes les colonnes requises sont présentes.');
          setLoading(false);
          return;
        }

        await processExcelData(jsonData);
        setLoading(false);
      };

      reader.onerror = () => {
        setError('Erreur lors de la lecture du fichier');
        setLoading(false);
      };

      reader.readAsBinaryString(file);
    } catch (err) {
      setError('Erreur lors du traitement du fichier');
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Importer des données Excel</h2>
      <div className="mb-4">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
          disabled={loading}
        />
      </div>

      {loading && (
        <div className="text-blue-600">
          Importation en cours...
        </div>
      )}

      {error && (
        <div className="text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="text-green-600">
          {success}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p>Format requis du fichier Excel :</p>
        <ul className="list-disc ml-5">
          <li>nom (texte)</li>
          <li>quantity (nombre)</li>
          <li>quantity_critique (nombre)</li>
          <li>prix (nombre)</li>
          <li>code (texte)</li>
          <li>ventes (nombre)</li>
          <li>date (date)</li>
          <li>description (texte, optionnel)</li>
        </ul>
      </div>
    </div>
  );
}; 