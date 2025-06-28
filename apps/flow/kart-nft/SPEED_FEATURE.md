# Kart NFT 車速功能說明

## 📋 功能概述

您的 Kart NFT 合約現已成功添加了**車速屬性**功能！每個鑄造的 NFT 都會隨機獲得一個車速值，基於以下機率分布：

## 🏎️ 車速分布

| 車速 | 稀有度 | 機率 | 稀有度分數 |
|------|--------|------|-----------|
| 10   | 傳奇   | 10%  | 100.0     |
| 8    | 稀有   | 30%  | 70.0      |
| 5    | 普通   | 60%  | 40.0      |

## 🎲 隨機機制

車速生成使用以下演算法：
- 基於當前區塊高度和總供應量生成隨機種子
- 生成 0-99 的隨機值
- 根據機率範圍分配車速：
  - 0-9: 車速 10 (10%)
  - 10-39: 車速 8 (30%)
  - 40-99: 車速 5 (60%)

## 📊 新增的合約功能

### NFT 屬性
- `speed: UInt8` - 車速屬性 (5, 8, 或 10)
- `getSpeedRarity(): String` - 獲取稀有度描述
- `getRarityScore(): UFix64` - 獲取稀有度分數

### MetadataViews 支援
- **Display**: 名稱和描述包含車速信息
- **Traits**: 車速作為可查詢的特性
- **Rarity**: 基於車速的稀有度評分

### Collection 功能
- `borrowKartNFT(id: UInt64)` - 借用特定 Kart NFT 引用以訪問車速

## 🔧 使用方法

### 鑄造 NFT
```cadence
// 鑄造單個 NFT
let nft <- minter.createNFT()  // 自動分配隨機車速

// 批量鑄造
let nfts <- minter.batchCreateNFT(quantity: 5)  // 每個都有隨機車速
```

### 查詢車速
```cadence
// 查詢特定 NFT 的車速
if let kartNFT = collection.borrowKartNFT(id: nftId) {
    let speed = kartNFT.speed
    let rarity = kartNFT.getSpeedRarity()
    let score = kartNFT.getRarityScore()
}
```

## 📝 新增腳本

1. **`get_kart_ids.cdc`** (已更新)
   - 返回用戶所有 Kart NFT 的 ID 和對應車速
   - 返回類型: `{UInt64: UInt8}`

2. **`get_supply_info.cdc`**
   - 查詢合約供應量信息（包含鑄造上限）

## 🚀 新增交易

1. **`mint_kart_with_speed.cdc`**
   - 鑄造帶車速的 Kart NFT
   - 在交易日誌中顯示車速和稀有度

2. **`batch_mint_kart_nft.cdc`** (已更新)
   - 批量鑄造，每個 NFT 獨立分配車速

## 🎮 遊戲應用

車速屬性可用於：
- **競速遊戲**: 更高車速的 NFT 在遊戲中表現更好
- **收藏價值**: 稀有的高速 NFT 更具收藏價值  
- **市場交易**: 車速可作為定價參考
- **稀有度展示**: 在 UI 中展示 NFT 的稀有程度

## 💡 技術特點

- ✅ **鏈上隨機**: 使用區塊高度和供應量作為隨機源
- ✅ **MetadataViews 兼容**: 完整的元數據支援
- ✅ **向後兼容**: 保持現有功能不變
- ✅ **供應量限制**: 維持 10,000 個 NFT 的上限
- ✅ **事件追蹤**: 鑄造事件包含所有必要信息

## 🔍 元數據示例

```json
{
  "name": "Kart NFT #123",
  "description": "賽車 NFT - 車速: 10 (傳奇)",
  "thumbnail": "https://example.com/kart/speed_10.png",
  "traits": [
    {
      "name": "車速",
      "value": 10,
      "displayType": "Number",
      "rarity": {
        "score": 100.0,
        "max": 100.0,
        "description": "傳奇"
      }
    }
  ]
}
```

恭喜！您的 Kart NFT 合約現在具備了完整的車速系統，為構建賽車遊戲和稀有度系統提供了堅實的基礎。
