FROM ruby:3.2-alpine

# Cài đặt các thư viện hệ thống cần thiết để biên dịch gem 'pg'
RUN apk add --no-cache build-base postgresql-dev tzdata nodejs

WORKDIR /app

ENV BUNDLE_PATH /usr/local/bundle

# Copy toàn bộ file cấu hình cài đặt vào trước
COPY Gemfile* ./

# 🎯 ĐOẠN CRITICAL: Xóa sạch file lock cũ (nếu có) và bắt buộc bundler sinh lại file lock chuẩn Linux Musl
RUN gem install bundler && \
    rm -f Gemfile.lock && \
    bundle install

# Copy toàn bộ source code còn lại vào container
COPY . .

# Xóa thêm một lần nữa ở tầng source code vừa copy để đảm bảo không bị ghi đè file lock cũ từ Windows vào
RUN rm -f Gemfile.lock

ENV PATH="/usr/local/bundle/bin:$PATH"

EXPOSE 5004

CMD ["bundle", "exec", "ruby", "app.rb", "-o", "0.0.0.0", "-p", "5004"]