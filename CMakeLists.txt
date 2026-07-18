cmake_minimum_required(VERSION 3.10)
project(SocialEngine VERSION 1.0.0 LANGUAGES CXX C)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# --- 1. CONFIGURAR CAMINHOS DO OPENSSL ---
set(OPENSSL_ROOT_DIR "C:/msys64/ucrt64")
set(OPENSSL_INCLUDE_DIR "${OPENSSL_ROOT_DIR}/include")

set(OPENSSL_CRYPTO_LIBRARY "${OPENSSL_ROOT_DIR}/lib/libcrypto.dll.a")
set(OPENSSL_SSL_LIBRARY "${OPENSSL_ROOT_DIR}/lib/libssl.dll.a")

set(OPENSSL_LIBRARIES ${OPENSSL_SSL_LIBRARY} ${OPENSSL_CRYPTO_LIBRARY})
set(OPENSSL_FOUND TRUE)

message(STATUS ">> OpenSSL Manual Configuration (MSYS2 UCRT64):")
message(STATUS ">> Include: ${OPENSSL_INCLUDE_DIR}")
message(STATUS ">> Crypto Lib: ${OPENSSL_CRYPTO_LIBRARY}")
message(STATUS ">> SSL Lib: ${OPENSSL_SSL_LIBRARY}")

# --- 2. CONFIGURAR FONTES DO PROJETO ---
file(GLOB_RECURSE SOURCES 
    "src/Core/*.cpp"
    "src/Auth/*.cpp"
    "src/Social/*.cpp"
    "src/Content/*.cpp"
    "src/Governance/*.cpp"
    "src/API/*.cpp"
    "src/main.cpp"
)

# --- 3. CONFIGURAR SQLITE (ESTÁTICO) ---
add_library(sqlite_lib STATIC libs/sqlite/sqlite3.c)
target_include_directories(sqlite_lib PUBLIC libs/sqlite)

# --- 4. CRIAR O EXECUTÁVEL ---
add_executable(SocialEngine ${SOURCES})

# --- 5. DIRETÓRIOS DE INCLUSÃO (HEADERS) ---
target_include_directories(SocialEngine PRIVATE 
    include                               
    include/External/jwt-cpp/include     
    ${OPENSSL_INCLUDE_DIR}                
)

# --- 6. LINKAR BIBLIOTECAS (BINÁRIOS) ---
target_link_libraries(SocialEngine PRIVATE 
    sqlite_lib 
    "${OPENSSL_SSL_LIBRARY}"    # Caminho direto para o libssl.lib
    "${OPENSSL_CRYPTO_LIBRARY}" # Caminho direto para o libcrypto.lib
)

if(WIN32)
    target_link_libraries(SocialEngine PRIVATE ws2_32 mswsock)
else()
    target_link_libraries(SocialEngine PRIVATE pthread)
endif()

message(STATUS ">> Social Engine build configured successfully! <<")