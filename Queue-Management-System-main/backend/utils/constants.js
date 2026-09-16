const TICKET_STATUS = {
    WAITING: 'waiting',
    CALLING: 'calling',
    SERVING: 'serving',
    ON_HOLD: 'on-hold',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

const USER_ROLES = {
    CUSTOMER: 'customer',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin'
};

module.exports = {
    TICKET_STATUS,
    USER_ROLES
};
