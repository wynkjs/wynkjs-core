-- Database Setup for Benchmark Tests
-- Creates the users table and indexes

-- Drop table if exists (for clean setup)
DROP TABLE IF EXISTS user_benchmark CASCADE;

-- Create user_benchmark table
CREATE TABLE user_benchmark (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    mobile VARCHAR(20),
    password VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    first_time_login BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_user_benchmark_email ON user_benchmark(email);
CREATE INDEX idx_user_benchmark_username ON user_benchmark(username);
CREATE INDEX idx_user_benchmark_mobile ON user_benchmark(mobile);
CREATE INDEX idx_user_benchmark_is_active ON user_benchmark(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_user_benchmark_updated_at BEFORE UPDATE ON user_benchmark
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some seed data for testing (optional)
-- Passwords are bcrypt hashed version of 'password123'
INSERT INTO user_benchmark (email, username, first_name, last_name, mobile, password)
VALUES
    ('john.doe@example.com', 'johndoe', 'John', 'Doe', '1234567890', '$2b$10$978sNSbGFCNAnqCnQGscX.MXtb53L1p3iVFS45eUBC878HYX6.m.e'),
    ('jane.smith@example.com', 'janesmith', 'Jane', 'Smith', '0987654321', '$2b$10$9XGINm4dl1LOGWh9r3Hncu4cY1yMLrzVbWfO.pRdEAZVBVxMTFsdK'),
    ('bob.wilson@example.com', 'bobwilson', 'Bob', 'Wilson', '5551234567', '$2b$10$IjoiZFEQ/y4ZCsWkurS7Ie3Uvkefcb0XJV9IuxHlCQD0DDeZloZhO'),
    ('alice.brown@example.com', 'alicebrown', 'Alice', 'Brown', '5559876543', '$2b$10$rkrUSrFygOhFN1xJmDJIcuGWzWsrGn0OP3ljuX5TIz8t8d1mL4DdO'),
    ('charlie.davis@example.com', 'charliedavis', 'Charlie', 'Davis', '5551112222', '$2b$10$eH6JdoSu71qR8o31nzns8OW1i7F7R0FRjjrIuN8sXz.ut8nWuZjS.');

-- Verify setup
SELECT 'Database setup complete!' AS status;
SELECT 'Total users: ' || COUNT(*) AS count FROM user_benchmark;
