def merge_sort(arr: list) -> list:
    """
    Hàm sắp xếp mảng sử dụng thuật toán Merge Sort.
    """
    # Điều kiện dừng đệ quy: nếu mảng có 1 phần tử hoặc rỗng thì đã được sắp xếp
    if len(arr) <= 1:
        return arr

    # 1. Chia (Divide): Tìm điểm giữa và chia mảng thành 2 nửa
    mid = len(arr) // 2
    left_half = arr[:mid]
    right_half = arr[mid:]

    # 2. Trị (Conquer): Đệ quy sắp xếp từng nửa
    merge_sort(left_half)
    merge_sort(right_half)

    # 3. Kết hợp (Merge): Trộn 2 nửa đã sắp xếp lại với nhau
    i = j = k = 0

    # Duyệt qua cả hai nửa và so sánh các phần tử để đưa vào mảng gốc
    while i < len(left_half) and j < len(right_half):
        if left_half[i] < right_half[j]:
            arr[k] = left_half[i]
            i += 1
        else:
            arr[k] = right_half[j]
            j += 1
        k += 1

    # Kiểm tra xem còn phần tử nào chưa được đưa vào mảng gốc không
    # (Trường hợp nửa trái còn dư)
    while i < len(left_half):
        arr[k] = left_half[i]
        i += 1
        k += 1

    # (Trường hợp nửa phải còn dư)
    while j < len(right_half):
        arr[k] = right_half[j]
        j += 1
        k += 1

    return arr

# ==========================================
# Ví dụ sử dụng
# ==========================================
if __name__ == "__main__":
    my_list = [38, 27, 43, 3, 9, 82, 10]
    print(f"Mảng trước khi sắp xếp: {my_list}")
    
    merge_sort(my_list)
    
    print(f"Mảng sau khi sắp xếp:   {my_list}")