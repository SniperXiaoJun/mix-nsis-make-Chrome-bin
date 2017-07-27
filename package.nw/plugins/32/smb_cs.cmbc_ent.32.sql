#"CREATE TABLE if not exists table_certificate (id INTEGER PRIMARY KEY UNIQUE ON CONFLICT REPLACE, content UNIQUE ON CONFLICT REPLACE, store_type, id_attr);"
#"CREATE TABLE if not exists table_certificate_attr (id INTEGER PRIMARY KEY UNIQUE ON CONFLICT REPLACE, cert_alg_type, cert_usage_type, skf_name, device_name, application_ame, container_name, common_name, subject, isuue, public_key, serial_number, subject_keyid, isuue_keyid, vendor_data, verify, not_before, not_after);"
#"CREATE TABLE if not exists table_skf (id INTEGER PRIMARY KEY UNIQUE ON CONFLICT REPLACE, name, path UNIQUE ON CONFLICT REPLACE, signtype, pin_verify);"
#"CREATE TABLE if not exists table_pid_vid (id INTEGER PRIMARY KEY UNIQUE ON CONFLICT REPLACE, pid UNIQUE ON CONFLICT REPLACE, vid, type);"
#"CREATE TABLE if not exists table_product (id INTEGER PRIMARY KEY UNIQUE ON CONFLICT REPLACE, name UNIQUE ON CONFLICT REPLACE, id_skf, id_pid_vid);"
#"CREATE TABLE if not exists table_check_list (id INTEGER PRIMARY KEY UNIQUE ON CONFLICT REPLACE, type UNIQUE ON CONFLICT REPLACE, description);"
#"CREATE TABLE if not exists table_check_keyid_list (id INTEGER PRIMARY KEY UNIQUE ON CONFLICT REPLACE, keyid UNIQUE ON CONFLICT REPLACE, type);"
#"CREATE TABLE if not exists table_fix_list (id INTEGER PRIMARY KEY UNIQUE ON CONFLICT REPLACE, type UNIQUE ON CONFLICT REPLACE);"
#"CREATE TABLE if not exists table_data (id INTEGER PRIMARY KEY UNIQUE ON CONFLICT REPLACE, data);"
#"CREATE TABLE if not exists table_element (id INTEGER PRIMARY KEY UNIQUE ON CONFLICT REPLACE, type, data, description);"
#"CREATE TABLE if not exists table_tlv (id INTEGER PRIMARY KEY UNIQUE ON CONFLICT REPLACE, type, value);"
#"CREATE TABLE if not exists table_fileinfo (id INTEGER PRIMARY KEY UNIQUE ON CONFLICT REPLACE, name UNIQUE ON CONFLICT REPLACE, path, digest_md5, digest_sha1, filetype, category);"
#"CREATE TABLE if not exists table_csp (id INTEGER PRIMARY KEY UNIQUE ON CONFLICT REPLACE, name UNIQUE ON CONFLICT REPLACE, value);"

##init skf
insert into table_skf (name, path, signtype, pin_verify) values("hbcmbc", "C:\WINDOWS\system32\hbcmbc86.dll", "digest", "1");
##insert into table_skf (name, path, signtype, pin_verify) values("BOIMCCSP11IS3K", "C:\Windows\system32\BOIMCCSP11IS3K.dll", "data", "0");
##insert into table_skf (name, path, signtype, pin_verify) values("BOIMCCSP11IS3K", "C:\Windows\system32\BOIMCCSP11IS3K.dll", "data", "0");
##insert into table_skf (name, path, signtype, pin_verify) values("BOIMCCSP11IS3K", "C:\Windows\system32\BOIMCCSP11IS3K.dll", "data", "0");

##init pid_vid
insert into table_pid_vid(pid, vid, type) values("1004", "14D6", "CSP");
insert into table_pid_vid(pid, vid, type) values("1006", "14D6", "CSP");
insert into table_pid_vid(pid, vid, type) values("3002", "14D6", "CSP");
insert into table_pid_vid(pid, vid, type) values("3032", "14D6", "SKF");
insert into table_pid_vid(pid, vid, type) values("3732", "14D6", "SKF");

##init csp
insert into table_csp (name, value) values("cmbc_ent", "CMBC CSP V1.0");




