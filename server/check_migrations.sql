SELECT migration_name,
       CASE WHEN finished_at IS NOT NULL THEN 'APPLIED'
            WHEN rolled_back_at IS NOT NULL THEN 'ROLLED_BACK'
            ELSE 'FAILED'
       END AS status,
       started_at,
       finished_at,
       rolled_back_at,
       logs
FROM "_prisma_migrations"
ORDER BY started_at;