import React, { useState } from 'react';
import { SideMenu } from '../components/SideMenu';
import { AIChatBot } from '../components/AIChatBot';
import { Page } from '../App';
import { Package, Truck, CheckCircle, Clock, MapPin, ChevronRight, X, CreditCard, Calendar, HelpCircle, AlertTriangle, RefreshCw, Phone, MessageCircle, Ban, DollarSign, Shield } from 'lucide-react';

interface OrderHistoryScreenProps {
  onNavigate: (page: Page) => void;
  currentTab: string;
  userName?: string;
}

interface OrderItem {
  name: string;
  quantity: string;
  price: number;
}

interface Order {
  id: string;
  type: 'buy' | 'sell'; // Distinguish between bought and sold items
  date: string;
  items: OrderItem[];
  total: number;
  status: 'Delivered' | 'In Transit' | 'Completed' | 'Processing';
  color: string;
  bg: string;
  address: string;
  paymentMethod: string;
  timeline: { time: string; event: string; completed: boolean }[];
}

const ORDERS: Order[] = [
  {
    id: '#ORD-7829',
    type: 'buy',
    date: 'Oct 12, 2023',
    items: [
      { name: 'Sharbati Wheat Seeds', quantity: '20kg', price: 3200 },
      { name: 'Organic Urea', quantity: '50kg', price: 1300 }
    ],
    total: 4500,
    status: 'Delivered',
    color: 'text-green-600',
    bg: 'bg-green-100',
    address: 'Village Rampur, Dist. Sehore, MP - 466001',
    paymentMethod: 'UPI (PhonePe)',
    timeline: [
      { time: 'Oct 10, 09:00 AM', event: 'Order Placed', completed: true },
      { time: 'Oct 11, 02:00 PM', event: 'Shipped from Warehouse', completed: true },
      { time: 'Oct 12, 11:30 AM', event: 'Out for Delivery', completed: true },
      { time: 'Oct 12, 04:15 PM', event: 'Delivered', completed: true },
    ]
  },
  {
    id: '#ORD-7701',
    type: 'buy',
    date: 'Sep 28, 2023',
    items: [
      { name: 'Solar Insect Trap', quantity: '1 Unit', price: 1200 },
      { name: 'Neem Oil', quantity: '5L', price: 650 }
    ],
    total: 1850,
    status: 'In Transit',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    address: 'Village Rampur, Dist. Sehore, MP - 466001',
    paymentMethod: 'Cash on Delivery',
    timeline: [
      { time: 'Sep 28, 10:00 AM', event: 'Order Placed', completed: true },
      { time: 'Sep 29, 06:00 PM', event: 'In Transit to Hub', completed: true },
      { time: 'Sep 30, 09:00 AM', event: 'Arrived at Local Hub', completed: false },
    ]
  },
  {
    id: '#ORD-7544',
    type: 'buy',
    date: 'Aug 15, 2023',
    items: [
      { name: 'Tractor Rental (25HP)', quantity: '5 Hours', price: 3000 }
    ],
    total: 3000,
    status: 'Completed',
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    address: 'Field No. 45, Rampur',
    paymentMethod: 'Wallet Balance',
    timeline: [
      { time: 'Aug 15, 07:00 AM', event: 'Booking Confirmed', completed: true },
      { time: 'Aug 15, 08:00 AM', event: 'Service Started', completed: true },
      { time: 'Aug 15, 01:00 PM', event: 'Service Completed', completed: true },
    ]
  },
  {
    id: '#SLD-9921',
    type: 'sell',
    date: 'Nov 02, 2023',
    items: [
      { name: 'Fresh Soybeans', quantity: '10 Quintal', price: 48000 }
    ],
    total: 48000,
    status: 'Processing',
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    address: 'Indore Mandi, Warehouse 4',
    paymentMethod: 'Bank Transfer (Pending)',
    timeline: [
      { time: 'Nov 02, 08:00 AM', event: 'Listing Created', completed: true },
      { time: 'Nov 02, 02:00 PM', event: 'Buyer Confirmed', completed: true },
      { time: 'Nov 03, 10:00 AM', event: 'Truck Scheduled', completed: false },
    ]
  }
];

export const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({ onNavigate, currentTab, userName }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Helper to render specific help options
  const renderHelpOptions = () => {
    if (!selectedOrder) return null;

    const isDelivered = selectedOrder.status === 'Delivered' || selectedOrder.status === 'Completed';
    const isBuyer = selectedOrder.type === 'buy';

    return (
      <div className="space-y-3">
        {/* BUYER OPTIONS */}
        {isBuyer && !isDelivered && (
          <>
            <button className="w-full flex items-center p-4 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors">
              <Ban size={20} className="mr-3" />
              Cancel Order
            </button>
            <button className="w-full flex items-center p-4 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors">
              <Truck size={20} className="mr-3" />
              Where is my order?
            </button>
          </>
        )}

        {isBuyer && isDelivered && (
          <>
            <button className="w-full flex items-center p-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm">
              <RefreshCw size={20} className="mr-3 text-green-600" />
              Return or Exchange Item
            </button>
            <button className="w-full flex items-center p-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm">
              <AlertTriangle size={20} className="mr-3 text-orange-500" />
              Report Quality Issue / Damaged Item
            </button>
            <button className="w-full flex items-center p-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm">
              <Package size={20} className="mr-3 text-blue-500" />
              Item different from picture
            </button>
          </>
        )}

        {/* SELLER OPTIONS */}
        {!isBuyer && !isDelivered && (
          <>
             <button className="w-full flex items-center p-4 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors">
              <Ban size={20} className="mr-3" />
              Cancel Pickup / Shipment
            </button>
            <button className="w-full flex items-center p-4 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors">
              <Truck size={20} className="mr-3" />
              Contact Logistics Partner
            </button>
          </>
        )}

        {!isBuyer && isDelivered && (
           <>
            <button className="w-full flex items-center p-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm">
              <DollarSign size={20} className="mr-3 text-green-600" />
              Payment Not Received
            </button>
            <button className="w-full flex items-center p-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm">
              <Shield size={20} className="mr-3 text-blue-500" />
              Raise Dispute
            </button>
           </>
        )}

        {/* COMMON OPTIONS */}
        <div className="border-t border-gray-100 my-2 pt-2"></div>
        <button className="w-full flex items-center p-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
          <MessageCircle size={20} className="mr-3" />
          Chat with {isBuyer ? 'Seller' : 'Buyer'}
        </button>
        <button className="w-full flex items-center p-4 bg-green-50 text-green-700 rounded-xl font-medium hover:bg-green-100 transition-colors">
          <Phone size={20} className="mr-3" />
          AgriBee Customer Care
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-poppins">
      {/* Header */}
      <div className="bg-[#1FAF55] pt-8 pb-6 px-5 rounded-b-[2rem] shadow-lg flex items-center space-x-3">
        <SideMenu onNavigate={onNavigate} currentPage={currentTab} whiteIcon={true} userName={userName} />
        <div>
          <h1 className="text-2xl font-bold text-white">Order History</h1>
          <p className="text-green-100 text-xs opacity-90">Track your purchases & sales</p>
        </div>
      </div>

      {/* List */}
      <div className="px-4 mt-6 space-y-4">
        {ORDERS.map((order) => (
          <div 
            key={order.id} 
            onClick={() => setSelectedOrder(order)}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-slide-up cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden"
          >
            {/* Type Indicator */}
            <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase rounded-bl-xl ${order.type === 'buy' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
              {order.type === 'buy' ? 'Purchase' : 'Sale'}
            </div>

            <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2 mt-2">
              <div>
                <p className="font-bold text-gray-800 text-sm">{order.id}</p>
                <p className="text-gray-400 text-xs">{order.date}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center ${order.bg} ${order.color}`}>
                {order.status === 'Delivered' && <CheckCircle size={12} className="mr-1" />}
                {order.status === 'In Transit' && <Truck size={12} className="mr-1" />}
                {order.status === 'Processing' && <Clock size={12} className="mr-1" />}
                {order.status === 'Completed' && <CheckCircle size={12} className="mr-1" />}
                {order.status}
              </div>
            </div>
            
            <div className="space-y-1 mb-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-gray-600 text-sm">
                  <div className="flex items-center">
                    <Package size={14} className="mr-2 text-gray-400" />
                    {item.name} <span className="text-gray-400 text-xs ml-1">x {item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center text-gray-500 text-xs">
                <MapPin size={12} className="mr-1" /> {order.type === 'buy' ? 'Home Delivery' : 'Pickup Scheduled'}
              </div>
              <div className="flex items-center">
                <span className="font-bold text-lg text-gray-800 mr-2">₹{order.total}</span>
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <p className="text-gray-400 text-xs">Showing recent activity only</p>
      </div>

      {/* Detailed View Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="bg-gray-50 w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden relative animate-slide-up flex flex-col max-h-[95vh]">
            
            {/* Modal Header */}
            <div className="bg-white p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
              <div>
                <div className="flex items-center space-x-2">
                   <h2 className="font-bold text-lg text-gray-800">Order Details</h2>
                   <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${selectedOrder.type === 'buy' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                     {selectedOrder.type === 'buy' ? 'Purchase' : 'Sale'}
                   </span>
                </div>
                <p className="text-xs text-gray-500">ID: {selectedOrder.id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Status Banner */}
              <div className={`p-4 rounded-xl flex items-center justify-between ${selectedOrder.bg}`}>
                 <div className="flex items-center">
                    <span className={`font-bold ${selectedOrder.color}`}>{selectedOrder.status}</span>
                 </div>
                 <span className={`text-xs font-medium ${selectedOrder.color}`}>{selectedOrder.date}</span>
              </div>

              {/* Items */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{item.name}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-gray-800">₹{item.price}</p>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
                    <span className="font-bold text-gray-800">Total Amount</span>
                    <span className="font-bold text-xl text-green-600">₹{selectedOrder.total}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Timeline</h3>
                <div className="relative space-y-6 pl-2">
                   {/* Vertical Line */}
                   <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-100"></div>
                   
                   {selectedOrder.timeline.map((step, idx) => (
                     <div key={idx} className="relative flex items-start space-x-4">
                       <div className={`relative z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-white ${step.completed ? 'border-green-500' : 'border-gray-300'}`}>
                          {step.completed && <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>}
                       </div>
                       <div className="flex-1 -mt-1">
                         <p className={`text-sm font-medium ${step.completed ? 'text-gray-800' : 'text-gray-400'}`}>{step.event}</p>
                         <p className="text-xs text-gray-400">{step.time}</p>
                       </div>
                     </div>
                   ))}
                </div>
              </div>

              {/* Shipping & Payment */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center mb-2">
                    <MapPin size={16} className="text-gray-400 mr-2" />
                    <h3 className="text-sm font-bold text-gray-800">{selectedOrder.type === 'buy' ? 'Shipping Address' : 'Pickup Location'}</h3>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">{selectedOrder.address}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center mb-2">
                    <CreditCard size={16} className="text-gray-400 mr-2" />
                    <h3 className="text-sm font-bold text-gray-800">Payment Info</h3>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">{selectedOrder.paymentMethod}</p>
                </div>
              </div>

            </div>
            
            {/* Help Button */}
            <div className="p-4 bg-white border-t border-gray-100">
               <button 
                 onClick={() => setShowHelpModal(true)}
                 className="w-full py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-100 transition-colors flex items-center justify-center"
               >
                 <HelpCircle size={18} className="mr-2" />
                 Need Help with this Order?
               </button>
            </div>

          </div>
        </div>
      )}

      {/* Help Options Modal (Bottom Sheet style) */}
      {showHelpModal && selectedOrder && (
         <div className="fixed inset-0 z-[60] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHelpModal(false)} />
            <div className="bg-white w-full max-w-lg rounded-t-[2rem] shadow-2xl relative animate-slide-up p-6 z-10">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-gray-800">How can we help?</h3>
                 <button onClick={() => setShowHelpModal(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200">
                   <X size={20} />
                 </button>
               </div>
               
               {renderHelpOptions()}
               
            </div>
         </div>
      )}

      <AIChatBot />
    </div>
  );
};
