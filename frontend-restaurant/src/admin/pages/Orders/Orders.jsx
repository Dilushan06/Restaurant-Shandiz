/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import "./Orders.css";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";

// eslint-disable-next-line react/prop-types
const Orders = ({ url }) => {
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 3;

  // Fetch orders from backend
  const fetchAllOrders = async () => {
    try {
      const response = await axios.get(url + "/api/order/list");
      if (response.data.success) {
        const paidOrders = response.data.data.filter(order => order.payment === true);
        setOrders(paidOrders);
      } else {
        toast.error("Error fetching orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    fetchAllOrders();
    const interval = setInterval(fetchAllOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  // Change order status
  const statusHandler = async (event, orderId) => {
    const response = await axios.post(url + "/api/order/status", {
      orderId,
      status: event.target.value,
    });
    if (response.data.success) {
      await fetchAllOrders();
    }
  };

  // Group orders by date
  const groupOrdersByDate = () => {
    const groupedOrders = {};

    orders.forEach((order) => {
      const orderDate = new Date(order.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!groupedOrders[orderDate]) {
        groupedOrders[orderDate] = [];
      }
      groupedOrders[orderDate].push(order);
    });

    // Sort orders within each date from recent to old
    Object.keys(groupedOrders).forEach((date) => {
      groupedOrders[date].sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    return Object.entries(groupedOrders).sort(
      (a, b) => new Date(b[0]) - new Date(a[0])
    );
  };

  // Flatten grouped orders for pagination
  const flattenGroupedOrders = () => {
    const groupedOrders = groupOrdersByDate();
    let allOrders = [];

    groupedOrders.forEach(([date, orders]) => {
      allOrders.push({ isDateHeader: true, date });
      allOrders.push(...orders);
    });

    return allOrders;
  };

  const allOrders = flattenGroupedOrders();

  // Get paginated orders
  const paginatedOrders = allOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  // Change background color based on order status
  const getStatusBackgroundColor = (status) => {
    switch (status) {
      case "Order Processing":
        return "#f8d7da";
      case "Ready to Takeaway":
        return "#fff3cd";
      case "Taken":
        return "#d4edda";
      default:
        return "#f8f9fa";
    }
  };

  return (
    <div className="order add">
      <h2>All Orders</h2>
      <div className="order-list">
        {paginatedOrders.map((order, index) =>
          order.isDateHeader ? (
            <h4 key={index} className="order-date">{order.date}</h4>
          ) : (
            <div
              key={index}
              className="order-item"
              style={{ backgroundColor: getStatusBackgroundColor(order.status) }}
            >
              <img src={assets.parcel_icon} alt="Parcel" />
              
              <div className="order-details">
                <p><b>Customer:</b> {order.address.firstName} {order.address.lastName}</p>
                <p><b>Address:</b> {order.address.houseNo}, {order.address.street}, {order.address.zipCode}</p>
                <p><b>Phone:</b> {order.address.phone}</p>
                <p><b>Total Items:</b> {order.items.length}</p>
                <p><b>Total Amount:</b> ${order.amount}.00</p>

                {/* 🟢 Show Order Items with Extras */}
                {order.items.map((item, idx) => (
                    <div key={idx} className="order-item-detail">
                        <p><b>{item.name} x {item.quantity}</b></p>
                        
                        {/* Show Extras with Quantity */}
                        {item.extras.length > 0 && (
                            <p className="order-extras">
                                <b>Extras:</b> {item.extras.map(extra => 
                                    `${extra.name} x ${extra.quantity || 1}`).join(", ")}
                            </p>
                        )}

                        {/* Show Comment if available */}
                        {item.comment && (
                            <p className="order-comment"><b>Note:</b> {item.comment}</p>
                        )}
                    </div>
                ))}

              </div>

              <select onChange={(event) => statusHandler(event, order._id)} value={order.status}>
                <option value="Order Processing">Order Processing</option>
                <option value="Ready to Takeaway">Ready to Takeaway</option>
                <option value="Taken">Taken</option>
              </select>
            </div>
          )
        )}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
          Previous
        </button>
        <span>Page {currentPage}</span>
        <button disabled={currentPage * ordersPerPage >= allOrders.length} onClick={() => setCurrentPage(currentPage + 1)}>
          Next
        </button>
      </div>
    </div>
  );
};

export default Orders;
