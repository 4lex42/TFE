"use client";

import React, { useEffect, useState } from "react";

interface Order {
  id: number;
  customer: string;
  product: string;
  quantity: number;
  status: string;
  date: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  // Exemple de données statiques (à remplacer par un fetch API plus tard)
  useEffect(() => {
    const sampleData: Order[] = [
      {
        id: 1,
        customer: "Jean Dupont",
        product: "Clavier",
        quantity: 2,
        status: "Livrée",
        date: "2024-04-12",
      },
      {
        id: 2,
        customer: "Alice Martin",
        product: "Écran",
        quantity: 1,
        status: "En attente",
        date: "2024-04-13",
      },
    ];
    setOrders(sampleData);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6 text-black">Liste des Commandes</h1>
        <table className="min-w-full border text-black">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 border">ID</th>
              <th className="px-4 py-2 border">Client</th>
              <th className="px-4 py-2 border">Produit</th>
              <th className="px-4 py-2 border">Quantité</th>
              <th className="px-4 py-2 border">Statut</th>
              <th className="px-4 py-2 border">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-100">
                <td className="px-4 py-2 border">{order.id}</td>
                <td className="px-4 py-2 border">{order.customer}</td>
                <td className="px-4 py-2 border">{order.product}</td>
                <td className="px-4 py-2 border">{order.quantity}</td>
                <td className="px-4 py-2 border">{order.status}</td>
                <td className="px-4 py-2 border">{order.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

