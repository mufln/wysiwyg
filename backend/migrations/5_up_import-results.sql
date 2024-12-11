CREATE TABLE import_results (
    id SERIAL PRIMARY KEY,
    job_id INT REFERENCES jobs(id)
);

CREATE TABLE import_results_entries (
    result_id INT REFERENCES import_results(id),
    formula_id INT REFERENCES formulas(id)
);