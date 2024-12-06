import pathlib
import psycopg
from sys import argv

def migrate(db: psycopg.connection, desired_version: int = None):

    print("Checking database version...")
    if not db.execute("select * from information_schema.tables where table_name=%s", ('__migrations__',)).rowcount:
        print("Database is empty, creating...")
        db.execute("CREATE TABLE IF NOT EXISTS __migrations__ (version SERIAL PRIMARY KEY)")
    cursor = db.cursor()
    cursor.execute("SELECT version FROM __migrations__ ORDER BY version DESC LIMIT 1")
    last_version = cursor.fetchone()
    last_version = last_version[0] if last_version else 0
    print(f"Database version: {last_version}")
    migration_files = {
        (int((sp := f.stem.split("_", 3))[0]), sp[1] if sp[1] in ["up", "down"] else exit(1)): f
        for f in pathlib.Path("./migrations").iterdir() if f.is_file() and f.name.lower().endswith(".sql")
    }
    if desired_version is not None:
        if desired_version > last_version:
            action = "up"
        elif desired_version < last_version:
            action = "down"
        else:
            print("No migration needed, exiting...")
            exit(0)
    else:
        action = "up"
        desired_version = max(list(map(lambda x: x[0], migration_files.keys())))
    if action == "up":
        for version in range(last_version + 1, desired_version + 1):
            if (version, "up") not in migration_files:
                print(f"No migration for version {version}, exiting...")
                exit(1)
            print(f"Migrating to version {version} // {migration_files[version, 'up'].stem.split('_')[2]}")
            with open(migration_files[version, "up"].absolute(), "r") as f:
                sql = f.read()
                cursor.execute(sql)
            cursor.execute("INSERT INTO __migrations__ (version) VALUES (%s)", (version,))
    elif action == "down":
        for version in range(last_version, desired_version, -1):
            if (version, "down") not in migration_files:
                print(f"No migration for version {version}, exiting...")
                exit(1)
            if version - 1 == 0:
                print("Migrating to version 0")
            else:
                print(
                    f"Migrating to version {version - 1} // {migration_files[version - 1, 'down'].stem.split('_')[0]}")
            with open(migration_files[version, "down"].absolute(), "r") as f:
                sql = f.read()
                cursor.execute(sql)
            cursor.execute("DELETE FROM __migrations__ WHERE version = %s", (version,))
    db.commit()

def main(args):
    match len(args):
        case a if a in [0, 1]:
            print("No arguments provided, exiting...")
            exit(0)
        case a if "-h" in args:
            print("migrate.py -h")
            print("Possible arguments:")
            print("    migrate.py <database-file> <version>")
            exit(0)
        case 2:
            db = psycopg.connect(args[0])
            if args[1] == "latest":
                desired_version = None
            else:
                desired_version = int(args[1])
        case _:
            print("Too many arguments provided, exiting...")
            exit(1)
    migrate(db, desired_version)

if __name__ == '__main__':
    args = argv[1:]
    main(args)
