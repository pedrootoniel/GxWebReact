-- =============================================================================
-- Pulse MuCMS - SQL Server Setup Script
-- =============================================================================
-- Run this on your MuOnline SQL Server database.
-- This script adds columns needed by the CMS without modifying existing tables.
-- It checks if columns/tables exist before creating them.
-- =============================================================================

USE MuOnline;
GO

-- Add Resets column to Character table if not exists
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Character' AND COLUMN_NAME = 'Resets'
)
BEGIN
  ALTER TABLE Character ADD Resets int NOT NULL DEFAULT 0;
  PRINT 'Added Resets column to Character table';
END
GO

-- Add GrandResets column to Character table if not exists
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Character' AND COLUMN_NAME = 'GrandResets'
)
BEGIN
  ALTER TABLE Character ADD GrandResets int NOT NULL DEFAULT 0;
  PRINT 'Added GrandResets column to Character table';
END
GO

-- Add MasterLevel column to Character table if not exists
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Character' AND COLUMN_NAME = 'MasterLevel'
)
BEGIN
  ALTER TABLE Character ADD MasterLevel int NOT NULL DEFAULT 0;
  PRINT 'Added MasterLevel column to Character table';
END
GO

-- Verify MEMB_INFO table exists (standard MuOnline table)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'MEMB_INFO')
BEGIN
  PRINT 'WARNING: MEMB_INFO table does not exist. This is a standard MuOnline table.';
  PRINT 'Make sure you are running this on the correct database.';
END
GO

-- Verify MEMB_STAT table exists
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'MEMB_STAT')
BEGIN
  CREATE TABLE MEMB_STAT (
    memb___id varchar(10) NOT NULL PRIMARY KEY,
    ConnectStat tinyint NOT NULL DEFAULT 0,
    ServerName varchar(50) NULL,
    IP varchar(15) NULL,
    ConnectTM datetime NULL
  );
  PRINT 'Created MEMB_STAT table';
END
GO

-- Verify AccountCharacter table exists
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AccountCharacter')
BEGIN
  CREATE TABLE AccountCharacter (
    Id varchar(10) NOT NULL PRIMARY KEY,
    GameID1 varchar(10) NULL,
    GameID2 varchar(10) NULL,
    GameID3 varchar(10) NULL,
    GameID4 varchar(10) NULL,
    GameID5 varchar(10) NULL,
    GameIDC varchar(10) NULL,
    MoveCnt int NOT NULL DEFAULT 0
  );
  PRINT 'Created AccountCharacter table';
END
GO

-- Create index for Character rankings performance
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = 'IX_Character_Rankings' AND object_id = OBJECT_ID('Character')
)
BEGIN
  CREATE NONCLUSTERED INDEX IX_Character_Rankings
  ON Character (Resets DESC, cLevel DESC, MasterLevel DESC)
  INCLUDE (Name, Class, GrandResets);
  PRINT 'Created rankings index on Character table';
END
GO

PRINT 'Pulse MuCMS SQL setup complete.';
GO
