#!/bin/sh
set -e

# Ensure unix socket dir exists
mkdir -p /run/postgresql
chown -R postgres:postgres /run/postgresql
chmod 777 /run/postgresql

# Mount tmpfs if not already mounted
if ! mount | grep -q "/var/lib/postgresql/data"; then
    mkdir -p /var/lib/postgresql/data
    mount -t tmpfs -o size=2G tmpfs /var/lib/postgresql/data
    chown -R postgres:postgres /var/lib/postgresql/data
fi

# Initialize DB if PG_VERSION doesn't exist
if [ ! -f /var/lib/postgresql/data/PG_VERSION ]; then
    chown -R postgres:postgres /var/lib/postgresql/data
    su - postgres -c "initdb -D /var/lib/postgresql/data"
    echo "listen_addresses = '*'" >> /var/lib/postgresql/data/postgresql.conf
    echo "host all all 0.0.0.0/0 trust" >> /var/lib/postgresql/data/pg_hba.conf
    echo "host all all ::0/0 trust" >> /var/lib/postgresql/data/pg_hba.conf
    echo "host all all all trust" >> /var/lib/postgresql/data/pg_hba.conf
fi

# Start postgres in background for initialization
su - postgres -c "pg_ctl -D /var/lib/postgresql/data -l /var/lib/postgresql/logfile start" || true
sleep 2

# Create user and db if needed
su - postgres -c "psql -tc \"SELECT 1 FROM pg_user WHERE usename = 'titan_admin'\" | grep -q 1 || psql -c \"CREATE USER titan_admin WITH SUPERUSER PASSWORD 'titan_secure_pass';\""
su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname = 'titan_auto_db'\" | grep -q 1 || psql -c \"CREATE DATABASE titan_auto_db OWNER titan_admin;\""

# Stop background pg_ctl so foreground postgres can own the socket
su - postgres -c "pg_ctl -D /var/lib/postgresql/data stop" || true
sleep 1

echo "POSTGRESQL_STARTING_FOREGROUND"
exec su - postgres -c "postgres -D /var/lib/postgresql/data"
