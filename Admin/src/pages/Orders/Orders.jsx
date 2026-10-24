import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { getAllOrders, updateOrderStatus } from '../../services/orderService';
import { formatDate, formatPrice } from '../../i18n';
import { PaymentBadge } from '../../components/common/Badges';
import { ORDER_STATUSES } from '../../constants';

const Orders = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      setOrders(await getAllOrders());
    } catch {
      toast.error(t('orders.loadError'));
    } finally {
      setLoading(false);
    }
  }

  const changeStatus = async (orderId, orderStatus) => {
    try {
      const updated = await updateOrderStatus(orderId, orderStatus);
      setOrders(orders => orders.map(order => order.id === orderId ? updated : order));
      toast.success(t('orders.statusUpdated'));
    } catch {
      toast.error(t('orders.statusError'));
    }
  }

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const result = { ALL: orders.length };
    ORDER_STATUSES.forEach((status) => {
      result[status] = orders.filter((o) => (o.orderStatus || 'PENDING') === status).length;
    });
    return result;
  }, [orders]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesFilter = filter === 'ALL' || (order.orderStatus || 'PENDING') === filter;
      const haystack = [order.id, order.email, order.phoneNumber, order.userAddress].join(' ').toLowerCase();
      return matchesFilter && (!query || haystack.includes(query));
    });
  }, [orders, filter, search]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('orders.title')}</h1>
          <p>{t('orders.subtitle', { count: orders.length })}</p>
        </div>
        <button type="button" className="btn btn-light" onClick={fetchOrders} disabled={loading}>
          <i className="bi bi-arrow-clockwise"></i>{t('common.refresh')}
        </button>
      </div>

      <section className="card-x">
        <div className="filter-pills">
          {['ALL', ...ORDER_STATUSES].map((status) => (
            <button key={status} type="button" className={`filter-pill ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}>
              {status === 'ALL' ? t('common.all') : t(`status.${status}`)}
              <span className="count">{counts[status]}</span>
            </button>
          ))}
        </div>
        <div className="toolbar">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input type="search" className="form-control" placeholder={t('orders.searchPlaceholder')}
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="loading-block"><span className="spinner-border" role="status"></span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><i className="bi bi-inbox"></i>{t('orders.empty')}</div>
        ) : (
          <div className="table-scroll">
            <table className="table-x">
              <thead>
                <tr>
                  <th>{t('orders.order')}</th>
                  <th>{t('orders.customer')}</th>
                  <th>{t('orders.items')}</th>
                  <th>{t('orders.amount')}</th>
                  <th>{t('orders.payment')}</th>
                  <th>{t('orders.status')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id}>
                    <td className="nowrap">
                      <p className="cell-title mono"><bdi>#{order.id.slice(-6).toUpperCase()}</bdi></p>
                      <p className="cell-sub">{formatDate(order.createdAt)}</p>
                    </td>
                    <td>
                      <p className="cell-title"><bdi>{order.email}</bdi></p>
                      <p className="cell-sub"><bdi>{order.phoneNumber}</bdi></p>
                      <p className="cell-sub">{order.userAddress}</p>
                    </td>
                    <td>
                      {(order.orderedItems || []).map((item, index) => (
                        <div key={index} className="nowrap"><strong>{item.quantity}×</strong> {item.name}</div>
                      ))}
                    </td>
                    <td className="nowrap fw-semibold">{formatPrice(order.amount)}</td>
                    <td><PaymentBadge status={order.paymentStatus} /></td>
                    <td>
                      <select className="form-select status-select" value={order.orderStatus || 'PENDING'}
                        aria-label={t('orders.status')} onChange={(e) => changeStatus(order.id, e.target.value)}>
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>{t(`status.${status}`)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}

export default Orders;
