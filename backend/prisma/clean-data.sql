-- Limpar dados do dashboard (mantendo membros e estrutura)

-- Deletar transações
DELETE FROM "Transaction"
WHERE "dashboardId" IN (SELECT id FROM "Dashboard");

-- Deletar contas (Account)
DELETE FROM "Account"
WHERE "dashboardId" IN (SELECT id FROM "Dashboard");

-- Deletar categorias (Category)
DELETE FROM "Category"
WHERE "dashboardId" IN (SELECT id FROM "Dashboard");

-- Deletar orçamentos (Budget)
DELETE FROM "Budget"
WHERE "dashboardId" IN (SELECT id FROM "Dashboard");

-- Deletar metas (Goal)  
DELETE FROM "Goal"
WHERE "dashboardId" IN (SELECT id FROM "Dashboard");

-- Deletar recorrências (RecurringTransaction)
DELETE FROM "RecurringTransaction"
WHERE "dashboardId" IN (SELECT id FROM "Dashboard");

-- Deletar alertas (Alert)
DELETE FROM "Alert"
WHERE "dashboardId" IN (SELECT id FROM "Dashboard");
