FROM ruby:3.2-alpine

# Cài đặt các thư viện hệ thống cần thiết
RUN apk add --no-cache build-base postgresql-dev tzdata nodejs

WORKDIR /app

# Thiết lập biến môi trường để bundle cài vào nơi hệ thống dễ tìm thấy
ENV BUNDLE_PATH /usr/local/bundle

COPY Gemfile Gemfile.lock ./
RUN gem install bundler && bundle install

COPY . .

# XÓA DÒNG RUN chmod +x bin/* NÀY ĐI
# Nếu bạn không có thư mục bin, dòng này sẽ gây lỗi

# Cấu hình lại PATH
ENV PATH="/usr/local/bundle/bin:$PATH"

EXPOSE 5004

# Chạy server
# Nếu là Sinatra, thông thường sẽ chạy bằng "bundle exec rackup" hoặc file chính
# Tôi để lệnh này mặc định, nếu không chạy hãy kiểm tra file chạy chính của bạn
CMD ["bundle", "exec", "ruby", "app.rb", "-o", "0.0.0.0", "-p", "5004"]