"use client"

import { useState, useEffect } from "react"
import { Table2, Send } from "lucide-react"
import Link from "next/link"
import { supabase } from "../lib/supabase"

// Types
interface Product {
  id: string
  sku: string
  name: string
  category: string
  price: number
  cost: number
  stock: number
  min_stock: number
}

interface Order {
  id: string
  product_id: string
  quantity: number
  total_price: number
  status: string
  order_date: string
}

export default function BaseDeDonneesPage() {
  const [activeTab, setActiveTab] = useState<"produit" | "commande" | "sql">("produit")
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [assistantMessage, setAssistantMessage] = useState("")
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM products LIMIT 10;")

  // Charger les données
  useEffect(() => {
    async function loadData() {
      const { data: productsData } = await supabase.from('products').select('*').limit(20)
      const { data: ordersData } = await supabase.from('orders').select('*').limit(20)
      if (productsData) setProducts(productsData)
      if (ordersData) setOrders(ordersData)
    }
    loadData()
  }, [])

  return (
    <div className="w-[1910px] h-[1117px] bg-[#141414] relative overflow-hidden mx-auto my-0">
      
      {/* Mini Sidebar icônes - gauche */}
      <div className="absolute top-[13.34%] left-[1.15%] flex flex-col items-center">
        <Link href="/" className="w-[33px] h-[33px] flex items-center justify-center mb-8">
          <img src="/IA.svg" alt="IA" className="w-[33px] h-[33px]" />
        </Link>
        <Link href="/" className="w-4 h-4 flex items-center justify-center mb-10 opacity-50 hover:opacity-100">
          <img src="/Star 1.svg" alt="Chat" className="w-4 h-4" />
        </Link>
        <Link href="/base-de-donnees" className="w-4 h-4 flex items-center justify-center mb-10">
          <img src="/base.svg" alt="Database" className="w-3 h-3.5" />
        </Link>
        <Link href="/tableau-de-bord" className="w-4 h-4 flex items-center justify-center mb-10 opacity-50 hover:opacity-100">
          <img src="/bord.svg" alt="Dashboard" className="w-3.5 h-3.5" />
        </Link>
        <Link href="/calendrier" className="w-4 h-4 flex items-center justify-center opacity-50 hover:opacity-100">
          <img src="/calendrier.svg" alt="Calendar" className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Container principal du contenu */}
      <div className="absolute top-[76px] left-[111px] w-[1331px] h-[1041px]">
        
        {/* Titre */}
        <span className="block h-[48px] text-[40px] font-light leading-[48px] text-white text-left whitespace-nowrap">
          La base donnée
        </span>

        {/* Bouton Rechercher - aligné à droite */}
        <div className="flex w-[124px] pt-[11px] pr-[31px] pb-[11px] pl-[31px] gap-[10px] justify-center items-center bg-[#0f0f0f] overflow-hidden mt-[32px] ml-[1207px] cursor-pointer hover:bg-[#1a1a1a]">
          <span className="flex w-[62px] h-[14px] justify-center items-start text-[12px] font-semibold leading-[14px] text-white text-center whitespace-nowrap">
            Rechercher
          </span>
        </div>

        {/* Grand conteneur noir */}
        <div className="w-[1331px] h-[926px] bg-[#0f0f0f] relative -mt-px">
          
          {/* Sidebar Schema à gauche */}
          <div className="absolute top-0 left-0 w-[252px] h-[926px] bg-[#161616] overflow-y-auto">
            <div className="p-3">
              {['users', 'dashboards', 'products', 'orders', 'stock_movements'].map((table) => (
                <div key={table} className="flex items-center gap-2 px-2 py-1.5 text-xs text-white/70 hover:bg-white/10 cursor-pointer">
                  <Table2 className="w-3 h-3 text-white/50" />
                  <span>{table}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Onglets - Position fixe après la sidebar */}
          <div className="absolute top-0 left-[252px] w-[100px] h-[23px] bg-[#d9d9d9] flex items-center justify-center cursor-pointer"
               onClick={() => setActiveTab("produit")}>
            <span className={`text-xs ${activeTab === "produit" ? "text-neutral-900 font-medium" : "text-neutral-600"}`}>
              Produit
            </span>
          </div>
          <div className="absolute top-0 left-[352px] w-[100px] h-[23px] bg-[rgba(217,217,217,0.46)] flex items-center justify-center cursor-pointer"
               onClick={() => setActiveTab("commande")}>
            <span className={`text-xs ${activeTab === "commande" ? "text-neutral-900 font-medium" : "text-neutral-600"}`}>
              Commande
            </span>
          </div>
          <div className="absolute top-0 left-[452px] w-[100px] h-[23px] bg-[rgba(217,217,217,0.36)] flex items-center justify-center cursor-pointer"
               onClick={() => setActiveTab("sql")}>
            <span className={`text-xs ${activeTab === "sql" ? "text-neutral-900 font-medium" : "text-neutral-500"}`}>
              Éditeur SQL
            </span>
          </div>

          {/* Contenu des onglets - Zone principale */}
          <div className="absolute top-[23px] left-[252px] right-0 bottom-0 overflow-auto p-4">
            {activeTab === "produit" && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-white/50 border-b border-white/10">
                      <th className="py-2 px-3 font-medium">SKU</th>
                      <th className="py-2 px-3 font-medium">Nom</th>
                      <th className="py-2 px-3 font-medium">Catégorie</th>
                      <th className="py-2 px-3 font-medium">Prix</th>
                      <th className="py-2 px-3 font-medium">Coût</th>
                      <th className="py-2 px-3 font-medium">Stock</th>
                      <th className="py-2 px-3 font-medium">Min</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 px-3 text-white/70">{product.sku}</td>
                        <td className="py-2 px-3 text-white">{product.name}</td>
                        <td className="py-2 px-3 text-white/70">{product.category}</td>
                        <td className="py-2 px-3 text-white">{product.price}€</td>
                        <td className="py-2 px-3 text-white/70">{product.cost}€</td>
                        <td className={`py-2 px-3 ${product.stock < product.min_stock ? 'text-red-400' : 'text-green-400'}`}>
                          {product.stock}
                        </td>
                        <td className="py-2 px-3 text-white/50">{product.min_stock}</td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-white/30">
                          Aucun produit trouvé
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "commande" && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-white/50 border-b border-white/10">
                      <th className="py-2 px-3 font-medium">ID</th>
                      <th className="py-2 px-3 font-medium">Produit ID</th>
                      <th className="py-2 px-3 font-medium">Quantité</th>
                      <th className="py-2 px-3 font-medium">Total</th>
                      <th className="py-2 px-3 font-medium">Statut</th>
                      <th className="py-2 px-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 px-3 text-white/50 font-mono text-[10px]">{order.id.slice(0, 8)}...</td>
                        <td className="py-2 px-3 text-white/50 font-mono text-[10px]">{order.product_id.slice(0, 8)}...</td>
                        <td className="py-2 px-3 text-white">{order.quantity}</td>
                        <td className="py-2 px-3 text-white">{order.total_price}€</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-white/50">{new Date(order.order_date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-white/30">
                          Aucune commande trouvée
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "sql" && (
              <div className="flex flex-col h-full gap-4">
                <div className="flex-1 bg-neutral-800 p-3 rounded">
                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    className="w-full h-full bg-transparent text-white font-mono text-xs resize-none focus:outline-none"
                    placeholder="Entrez votre requête SQL..."
                  />
                </div>
                <div className="h-32 bg-neutral-800 p-3 rounded">
                  <div className="text-xs text-white/30">Les résultats apparaîtront ici...</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zone Discussion IA - à droite */}
      <div className="absolute top-[193px] left-[1495px] right-[-32px] h-[782px]">
        
        {/* Premier message utilisateur */}
        <div className="flex flex-col items-start ml-[217px] w-[132px]">
          <span className="text-[12px] font-normal leading-[13.8px] text-[#616161] text-left w-[132px] h-[28px]">
            Bonjour comment-vas tu Aujourd'hui
          </span>
          <div className="flex pt-[10px] pr-[10px] pb-[10px] pl-0 gap-[10px] justify-center items-center">
            <span className="h-[11px] text-[10px] font-normal leading-[11px] text-[#616161] text-left whitespace-nowrap">
              Salah-Eddine Sriar
            </span>
            <span className="h-[11px] text-[10px] font-normal leading-[11px] text-[rgba(255,255,255,0.18)] text-left whitespace-nowrap">
              21h03
            </span>
          </div>
        </div>

        {/* Indicateur "En train d'écrire" */}
        <div className="flex w-[116px] gap-[6px] items-center mt-[3px]">
          <div className="w-[15px] h-[17.328px] flex items-center justify-center">
            <img src="/Star 1.svg" alt="" className="w-[15px] h-[17px]" />
          </div>
          <div className="flex pt-[5px] pr-[5px] pb-[5px] pl-[5px] flex-col items-start">
            <span className="h-[14px] text-[12px] font-normal leading-[13.8px] text-blue-500 text-left whitespace-nowrap">
              En train d'ecrire
            </span>
          </div>
        </div>

        {/* Box gradient bleue - Réponse IA */}
        <div className="w-[349px] h-[142px] bg-gradient-to-b from-blue-800 to-blue-950 relative mt-[5px]">
          <div className="flex w-[78px] h-[14px] justify-between items-center mt-[6px] ml-[8px]">
            <img src="/Star 1.svg" alt="" className="w-[13px] h-[13px] rounded-[0.41px]" />
            <span className="h-[14px] text-[12px] font-normal leading-[13.8px] text-white text-left whitespace-nowrap">
              Assistance
            </span>
          </div>
          <div className="w-[348px] h-[0.4px] bg-white/40 mt-[9.8px] ml-[0.5px]" />
          <span className="flex w-[316px] h-[68px] justify-start items-start text-[12px] font-normal leading-[14.4px] text-white text-left mt-[4.8px] ml-[11px]">
            dhaidhaiahdiadhaidhaidhaidhaidhakdhdikahdiahdiahdhaidh
            <br />
            adkahdkjahdiuahdiahdiahd
            <br />
            doaidhaodhaodhaodhoahda
            <br />
            daodhaodhaodhad
            <br />
            adôadoiahd
          </span>
        </div>

        {/* Deuxième message utilisateur */}
        <div className="flex flex-col items-start mt-[58px] ml-[189px] w-[258px]">
          <span className="h-[14px] text-[12px] font-normal leading-[13.8px] text-[#616161] text-left whitespace-nowrap">
            Bonjour comment-vas tu Aujourd'hui
          </span>
          <div className="flex w-[132px] pt-[10px] pr-[10px] pb-[10px] pl-0 gap-[10px] justify-center items-center">
            <span className="h-[11px] text-[10px] font-normal leading-[11px] text-[#616161] text-left whitespace-nowrap">
              Salah-Eddine Sriar
            </span>
            <span className="h-[11px] text-[10px] font-normal leading-[11px] text-[rgba(255,255,255,0.18)] text-left whitespace-nowrap">
              21h03
            </span>
          </div>
        </div>

        {/* Boîte de saisie IA */}
        <div className="flex w-[251.714px] pt-[12.381px] pr-[12.381px] pb-[12.381px] pl-[12.381px] gap-[12.381px] justify-center items-center bg-[#232323] border-solid border-[1.238px] border-[#1337bb] mt-[394px] ml-[63px]">
          <div className="flex w-[18.571px] flex-col items-start">
            <img src="/Star 1.svg" alt="" className="h-[11.143px] w-full rounded-[0.51px] opacity-50" />
          </div>
          <input
            type="text"
            value={assistantMessage}
            onChange={(e) => setAssistantMessage(e.target.value)}
            placeholder="Aidez vous grâce a l'assistant"
            className="bg-transparent text-[#454545] text-[14.857px] font-normal leading-[17px] placeholder:text-[#454545] focus:outline-none flex-1"
          />
          <button className="text-blue-500 hover:text-blue-400">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
