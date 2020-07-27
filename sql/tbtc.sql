CREATE TABLE `tbtc_deposit` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `depositAddr` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ethWalletAddr` varchar(100) NOT NULL,
  `ethWalletPri` varchar(100) NOT NULL,
  `keepAddr` varchar(100) NOT NULL,
  `depositBtcAddr` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `lotSize` int(64) NOT NULL DEFAULT '0',
  `depositBtcTx` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `depositBtcTs` timestamp NULL DEFAULT NULL,
  `lastResumedAt` timestamp NULL DEFAULT NULL,
  `mintedTBTC` int(64) NOT NULL DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_depoist` (`depositAddr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `tbtc_wallet` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `address` varchar(100) DEFAULT '',
  `priKey` varchar(100) DEFAULT '',
  `walletType` varchar(100) DEFAULT '',
  `lastUsedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_addr` (`address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
