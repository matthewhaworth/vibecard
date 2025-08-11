<!DOCTYPE html>
<html>
<head>
    <style>
        @page {
            margin: 0;
            size: a5 landscape;
        }
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            font-family: sans-serif;
        }
        .page {
            width: 100%;
            height: 100%;
            page-break-after: always;
        }
        .page:last-child {
            page-break-after: auto;
        }
        .image-page {
            background-image: url("{{ $image_url }}");
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center;
        }
        .message-page {
            padding-top: 200px;
            padding-left: 20px;
            box-sizing: border-box;
        }
        .layout-table {
            width: 100%;
            height: 100%;
            border-collapse: collapse;
        }
        .message-cell {
            width: 50%;
            padding-right: 10px;
            text-align: left;
            vertical-align: middle;
        }
        .address-cell {
            width: 50%;
            padding-left: 10px;
            vertical-align: top;
        }
    </style>
</head>
<body>
    <div class="page image-page"></div>
    <div class="message-page">
        <table class="layout-table">
            <tr>
                <td class="message-cell">
                    <p>{{ $message }}</p>
                </td>
                <td class="address-cell">
                    {{-- Address and stamp area can be designed here --}}
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
