# Plano: Sincronização Automática de Dados ao Iniciar o App

## Problema

O aplicativo está utilizando dados locais (AsyncStorage) que não estão sincronizados com o banco de dados SQLite. O banco foi corrigido recentemente, mas está vazio.

## Objetivo

Implementar sincronização automática ao iniciar o app:
1. Carregar dados do banco SQLite como fonte principal
2. Se banco vazio e AsyncStorage tem dados → migrar para o banco
3. Usar dados do banco após sincronização

## Fluxo Proposto

```
App Inicia
    │
    ▼
Carregar dados do Banco SQLite
    │
    ├── Banco tem dados → Usar dados do banco
    │
    ├── Banco vazio E AsyncStorage tem dados → Migrar para banco
    │   └── Após migração: usar dados do banco
    │
    └── Banco e AsyncStorage vazios → Estado inicial vazio
```

## Alterações Necessárias

### 1. Modificar `loadAllData` em `context/AppContext.tsx`

**Lógica Nova:**
1. Tentar carregar do banco SQLite via tRPC
2. Se banco retornou dados → usar dados do banco
3. Se banco vazio E AsyncStorage tem dados → fazer upload para banco
4. Salvar no AsyncStorage como cache offline

### 2. Criar função de migração

**Para cada entidade (tags, products, clients, sales):**
- Ler dados do AsyncStorage
- Inserir no banco via tRPC

### 3. Modificar `saveData`

**Mudar para:**
- Salvar no banco (via tRPC) primeiro
- AsyncStorage como cache de backup

## Estrutura do Código

```typescript
// No AppContext.tsx

const loadAllData = async () => {
  // 1. Carregar do banco
  const [dbTags, dbProducts, dbClients, dbSales] = await Promise.all([...]);

  // 2. Se banco vazio, verificar AsyncStorage
  if (dbTags.length === 0 && hasLocalData('tags')) {
    await migrateDataFromLocalToServer();
  }

  // 3. Usar dados do banco (sincronizados)
  dispatch({ type: 'LOAD_DATA', payload: { ... } });

  // 4. Salvar no AsyncStorage como cache
  await saveToLocalCache();
};

const migrateDataFromLocalToServer = async () => {
  // Ler dados locais
  const localTags = await AsyncStorage.getItem(STORAGE_KEYS.TAGS);
  // Enviar para banco
  for (const tag of localTags) {
    await trpc.tags.save.mutate(tag);
  }
  // Repetir para products, clients, sales
};

const saveData = async (newState) => {
  // Salvar no banco (principal)
  await syncToDatabase(newState);

  // Salvar no AsyncStorage (backup offline)
  await saveToLocalCache(newState);
};
```

## Regras de Negócio

1. **Fonte principal**: Banco de dados SQLite
2. **Fallback**: Se banco indisponível, usar AsyncStorage
3. **Migração**: Se banco vazio e local tem dados → migrar automaticamente
4. **Conflitos**: Banco wins (dados do banco sobrescrevem local)

## Riscos e Considerações

1. **Conexão**: Se não houver banco disponível, usar fallback atual (AsyncStorage)
2. **Conflitos**: Se houver dados diferentes no banco vs local, o banco wins
3. **Performance**: Migrar grandes quantidades de dados pode ser lento
4. **Offline**: App pode funcionar offline com dados em cache local

## Status

- [x] Implementar função de detecção de dados locais
- [x] Implementar função de migração para cada entidade
- [x] Modificar loadAllData para lógica de sincronização
- [ ] Testar sincronização automática ao iniciar
- [ ] Testar criação/edição de novos dados

## Observações

- Os erros de tRPC no AppContext são pré-existentes (configuração do tipo)
- A sincronização ocorre automaticamente ao iniciar o app
- Se banco vazio + dados locais → migra automaticamente para o banco
- Se banco com dados → usa dados do banco (sobrescreve local)