#!/bin/sh
set -e

# Ensure unix socket dir exists
mkdir -p /run/postgresql
chown -R postgres:postgres /run/postgresql
chmod 777 /run/postgresql

# Mount persistent ext4 loop image from host storage if not already mounted
DISK_IMG="/mnt/host/d/automobile/pgdata.ext4"
MOUNT_DIR="/var/lib/postgresql/mount"
PG_DATA="/var/lib/postgresql/mount/data"

if ! mount | grep -q "$MOUNT_DIR"; then
    mkdir -p "$MOUNT_DIR"
    if [ ! -f "$DISK_IMG" ]; then
        echo "Creating 4GB sparse ext4 disk image on persistent storage: $DISK_IMG"
        truncate -s 4G "$DISK_IMG"
        mkfs.ext4 -F "$DISK_IMG"
    fi
    mount -o loop "$DISK_IMG" "$MOUNT_DIR"
    mkdir -p "$PG_DATA"
    chown -R postgres:postgres "$MOUNT_DIR"
    chmod 700 "$PG_DATA"
fi

# Ensure symlink from standard /var/lib/postgresql/data for backward compatibility
if [ ! -L /var/lib/postgresql/data ]; then
    rm -rf /var/lib/postgresql/data
    ln -s "$PG_DATA" /var/lib/postgresql/data
fi

# Initialize DB if PG_VERSION doesn't exist on persistent storage
if [ ! -f "$PG_DATA/PG_VERSION" ]; then
    chown -R postgres:postgres "$PG_DATA"
    chmod 700 "$PG_DATA"
    su - postgres -c "initdb -D $PG_DATA"
    echo "listen_addresses = '*'" >> "$PG_DATA/postgresql.conf"
    echo "host all all 0.0.0.0/0 trust" >> "$PG_DATA/pg_hba.conf"
    echo "host all all ::0/0 trust" >> "$PG_DATA/pg_hba.conf"
    echo "host all all all trust" >> "$PG_DATA/pg_hba.conf"
fi

# Check if postgres is already running
if su - postgres -c "pg_ctl -D $PG_DATA status" 2>/dev/null | grep -q "server is running"; then
    echo "PostgreSQL is already running."
    exit 0
fi

# Start postgres in background for initialization
su - postgres -c "pg_ctl -D $PG_DATA -l /var/lib/postgresql/logfile start" || true
sleep 2

# Create user and db if needed
su - postgres -c "psql -tc \"SELECT 1 FROM pg_user WHERE usename = 'titan_admin'\" | grep -q 1 || psql -c \"CREATE USER titan_admin WITH SUPERUSER PASSWORD 'titan_secure_pass';\""
su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname = 'titan_auto_db'\" | grep -q 1 || psql -c \"CREATE DATABASE titan_auto_db OWNER titan_admin;\""

# If --daemon or -d is passed, keep running in background and exit cleanly
if [ "$1" = "-d" ] || [ "$1" = "--daemon" ]; then
    echo "POSTGRESQL_RUNNING_DAEMON"
    exit 0
fi

# Stop background pg_ctl so foreground postgres can own the socket
su - postgres -c "pg_ctl -D $PG_DATA stop" || true
sleep 1

echo "POSTGRESQL_STARTING_FOREGROUND"
exec su - postgres -c "postgres -D $PG_DATA"
