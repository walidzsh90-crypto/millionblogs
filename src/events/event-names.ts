export const EventName = {
  USER_REGISTERED: 'user.registered',
  USER_LOGGED_IN: 'user.logged_in',
  USER_LOGGED_OUT: 'user.logged_out',
  PASSWORD_RESET_REQUESTED: 'password.reset_requested',
  PASSWORD_CHANGED: 'password.changed',
  ROLE_ASSIGNED: 'role.assigned',
  SESSION_REVOKED: 'session.revoked',

  BLOG_CREATED: 'blog.created',
  BLOG_UPDATED: 'blog.updated',
  BLOG_DELETED: 'blog.deleted',
  BLOG_RESTORED: 'blog.restored',
  BLOG_VERIFIED: 'blog.verified',
  BLOG_REJECTED: 'blog.rejected',
  BLOG_SUSPENDED: 'blog.suspended',
  OWNERSHIP_TRANSFERRED: 'blog.ownership_transferred',
  BLOG_TRUST_CHANGED: 'blog.trust_changed',

  // Ownership Verification
  OWNERSHIP_VERIFICATION_INITIATED: 'ownership.verification_initiated',
  OWNERSHIP_VERIFIED: 'ownership.verified',
  OWNERSHIP_VERIFICATION_FAILED: 'ownership.verification_failed',
  OWNERSHIP_VERIFICATION_EXPIRED: 'ownership.verification_expired',

  // RSS Feeds
  FEED_ADDED: 'feed.added',
  FEED_UPDATED: 'feed.updated',
  FEED_DISABLED: 'feed.disabled',
  FEED_FAILED: 'feed.failed',
  FEED_RECOVERED: 'feed.recovered',
  FEED_SYNCED: 'feed.synced',
  ARTICLE_DISCOVERED: 'feed.article_discovered',

  // Articles
  ARTICLE_CREATED: 'article.created',
  ARTICLE_PUBLISHED: 'article.published',
  ARTICLE_REJECTED: 'article.rejected',
  ARTICLE_ARCHIVED: 'article.archived',
  ARTICLE_UPDATED: 'article.updated',

  // Search
  SEARCH_PERFORMED: 'search.performed',

  // SEO
  SITEMAP_GENERATED: 'seo.sitemap_generated',
  SEO_METADATA_UPDATED: 'seo.metadata_updated',

  // Wallet
  WALLET_CREDITED: 'wallet.credited',
  WALLET_DEBITED: 'wallet.debited',
  WALLET_HELD: 'wallet.held',
  WALLET_RELEASED: 'wallet.released',
  WALLET_REFUNDED: 'wallet.refunded',
  WALLET_ADJUSTED: 'wallet.adjusted',

  // Payments
  PAYMENT_CREATED: 'payment.created',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',

  // Plans
  PLAN_CREATED: 'plan.created',
  PLAN_UPDATED: 'plan.updated',

  // Founder
  FOUNDER_SEAT_CLAIMED: 'founder.seat_claimed',
  FOUNDER_PROGRAM_CLOSED: 'founder.program_closed',
  FOUNDER_UPGRADED: 'founder.upgraded',

  // Subscriptions
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_ACTIVATED: 'subscription.activated',
  SUBSCRIPTION_RENEWED: 'subscription.renewed',
  SUBSCRIPTION_EXPIRED: 'subscription.expired',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  SUBSCRIPTION_SUSPENDED: 'subscription.suspended',
  SUBSCRIPTION_GRACE_PERIOD: 'subscription.grace_period',

  // Feature Access
  FEATURE_ACCESS_CHANGED: 'feature.access_changed',

  // Promotions
  CAMPAIGN_CREATED: 'promotion.campaign_created',
  CAMPAIGN_ACTIVATED: 'promotion.campaign_activated',
  CAMPAIGN_PAUSED: 'promotion.campaign_paused',
  CAMPAIGN_COMPLETED: 'promotion.campaign_completed',
  CAMPAIGN_EXPIRED: 'promotion.campaign_expired',
  CREDITS_CONSUMED: 'promotion.credits_consumed',
  PROMOTION_CLICKED: 'promotion.clicked',
  PROMOTION_VIEWED: 'promotion.viewed',

  // Badges
  BADGE_CREATED: 'badge.created',
  BADGE_ASSIGNED: 'badge.assigned',
  BADGE_REVOKED: 'badge.revoked',
  BADGE_VISIBILITY_CHANGED: 'badge.visibility_changed',

  // Notifications
  NOTIFICATION_CREATED: 'notification.created',
  NOTIFICATION_READ: 'notification.read',
  NOTIFICATION_ARCHIVED: 'notification.archived',

  // Support
  TICKET_CREATED: 'support.ticket_created',
  TICKET_REPLIED: 'support.ticket_replied',
  TICKET_STATUS_CHANGED: 'support.ticket_status_changed',
  TICKET_ASSIGNED: 'support.ticket_assigned',
} as const;
