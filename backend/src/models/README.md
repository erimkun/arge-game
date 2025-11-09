# Backend - Models

Bu klasör, veri modelleri ve tip tanımlamalarını içerir.

## 📋 Kullanım

Bu klasör, uygulama genelinde kullanılan veri yapılarını ve modelleri içerir.

## 🎯 Veri Yapıları

### Profile Model
```javascript
{
  id: string,
  name: string,
  avatar?: string
}
```

### Vote Model
```javascript
{
  [profileId: string]: number
}
```

### Voting Results Model
```javascript
{
  winners: Profile[],
  finalVotes: { [profileId: string]: number },
  totalParticipants: number,
  totalVotesCast: number
}
```

## 🎯 SOLID Prensipleri

- **Single Responsibility**: Her model tek bir veri yapısını temsil eder
- **Data Structure**: Veri yapıları açık ve anlaşılır şekilde tanımlanır

