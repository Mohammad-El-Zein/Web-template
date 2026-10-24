import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAdmin } from '../../context/AdminContext';
import { getAllOrders } from '../../services/orderService';
import { getFoodList } from '../../services/foodService';
import { formatDate, formatPrice, localizedText } from '../../i18n';
import { OrderStatusBadge, PaymentBadge } from '../../components/common/Badges';
import RevenueChart from './RevenueChart';

const isSameDay = (a, b) => a.toDateString() === b.toDateString();

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const { profile } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllOrders(), getFoodList()])
      .then(([orderData, foodData]) => {
        setOrders(orderData);
        setFoods(foodData);
      })
      .catch(() => toast.error(t('orders.loadError')))
      .finally(() => setLoading(false));
  }, [t]);

  const stats = useMemo(() => {
    const today = new Date();
    const paid = orders.filter((o) => o.paymentStatus === 'PAID');
    const revenue = paid.reduce((sum, o) => sum + (o.amount || 0), 0);
    const revenueToday = paid.filter((o) => o.createdAt && isSameDay(new Date(o.createdAt), today))
      .reduce((sum, o) => sum + (o.amount || 0), 0);
    const ordersToday = orders.filter((o) => o.createdAt && isSameDay(new Date(o.createdAt), today)).length;
    const open = paid.filter((o) => ['PREPARING', 'OUT_FOR_DELIVERY'].includes(o.orderStatus)).length;

    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - i));
      const dayRevenue = paid.filter((o) => o.createdAt && isSameDay(new Date(o.createdAt), date))
        .reduce((sum, o) => sum + (o.amount || 0), 0);
      return { date, revenue: Math.round(dayRevenue * 100) / 100 };
    });

    // Meistverkaufte Gerichte (nur bezahlte Bestellungen)
    const counts = {};
    paid.forEach((o) => (o.orderedItems || []).forEach((item) => {
      counts[item.foodId] = counts[item.foodId] || { foodId: item.foodId, name: item.name, quantity: 0 };
      counts[item.foodId].quantity += item.quantity || 0;
    }));
    const topDishes = Object.values(counts).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    return { revenue, revenueToday, ordersToday, open, days, topDishes };
  }, [orders]);

  const foodById = useMemo(() => Object.fromEntries(foods.map((f) => [f.id, f])), [foods]);
  const firstName = (profile?.name || '').split(' ')[0] || profile?.email?.split('@')[0] || '';

  if (loading) {
    return <div className="loading-block"><span className="spinner-border" role="status"></span></div>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('dashboard.greeting', { name: firstName })}</h1>
          <p>{t('dashboard.subtitle')}</p>
        </div>
        <Link to="/foods/new" className="btn btn-primary"><i className="bi bi-plus-lg"></i>{t('foods.add')}</Link>
      </div>

      <div className="stats-grid">
        <div className="card-x stat-card">
          <div className="stat-icon brand"><i className="bi bi-cash-stack"></i></div>
          <div>
            <p className="stat-label">{t('dashboard.totalRevenue')}</p>
            <p className="stat-value">{formatPrice(stats.revenue)}</p>
            <p className="stat-hint">{t('dashboard.revenueToday', { amount: formatPrice(stats.revenueToday) })}</p>
          </div>
        </div>
        <div className="card-x stat-card">
          <div className="stat-icon info"><i className="bi bi-receipt"></i></div>
          <div>
            <p className="stat-label">{t('dashboard.orders')}</p>
            <p className="stat-value">{orders.length}</p>
            <p className="stat-hint">{t('dashboard.ordersToday', { count: stats.ordersToday })}</p>
          </div>
        </div>
        <div className="card-x stat-card">
          <div className="stat-icon accent"><i className="bi bi-fire"></i></div>
          <div>
            <p className="stat-label">{t('dashboard.openOrders')}</p>
            <p className="stat-value">{stats.open}</p>
            <p className="stat-hint">{t('dashboard.openOrdersHint')}</p>
          </div>
        </div>
        <div className="card-x stat-card">
          <div className="stat-icon success"><i className="bi bi-egg-fried"></i></div>
          <div>
            <p className="stat-label">{t('dashboard.dishes')}</p>
            <p className="stat-value">{foods.length}</p>
            <p className="stat-hint">{t('dashboard.dishesHint')}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="card-x">
          <div className="card-x-header">
            <div>
              <h2>{t('dashboard.chartTitle')}</h2>
              <p className="sub">{t('dashboard.chartSubtitle')}</p>
            </div>
          </div>
          <div className="card-x-body">
            <RevenueChart days={stats.days} key={i18n.language} />
          </div>
        </section>

        <section className="card-x">
          <div className="card-x-header">
            <h2>{t('dashboard.topDishes')}</h2>
          </div>
          {stats.topDishes.length === 0 ? (
            <div className="empty-state"><i className="bi bi-bar-chart"></i>{t('dashboard.noSales')}</div>
          ) : stats.topDishes.map((dish, index) => {
            const food = foodById[dish.foodId];
            return (
              <div className="list-row" key={dish.foodId}>
                <span className="rank">{index + 1}</span>
                {food?.imageUrl ? <img src={food.imageUrl} alt="" className="thumb" /> : <span className="thumb"></span>}
                <div className="grow">
                  <p className="title">{food ? localizedText(food.name) : dish.name}</p>
                  <p className="meta">{t('dashboard.sold', { count: dish.quantity })}</p>
                </div>
              </div>
            );
          })}
        </section>
      </div>

      <section className="card-x">
        <div className="card-x-header">
          <h2>{t('dashboard.recentOrders')}</h2>
          <Link to="/orders" className="link-btn">{t('dashboard.viewAll')}</Link>
        </div>
        {orders.length === 0 ? (
          <div className="empty-state"><i className="bi bi-inbox"></i>{t('dashboard.noOrders')}</div>
        ) : (
          <div className="table-scroll">
            <table className="table-x">
              <thead>
                <tr>
                  <th>{t('orders.order')}</th>
                  <th>{t('orders.customer')}</th>
                  <th>{t('orders.amount')}</th>
                  <th>{t('orders.payment')}</th>
                  <th>{t('orders.status')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id}>
                    <td>
                      <p className="cell-title mono"><bdi>#{order.id.slice(-6).toUpperCase()}</bdi></p>
                      <p className="cell-sub">{formatDate(order.createdAt)}</p>
                    </td>
                    <td><bdi>{order.email}</bdi></td>
                    <td className="nowrap">{formatPrice(order.amount)}</td>
                    <td><PaymentBadge status={order.paymentStatus} /></td>
                    <td><OrderStatusBadge status={order.orderStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
};

export default Dashboard;
